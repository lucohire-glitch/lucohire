import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { pool } from '../config/db.js';

const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: env.razorpay.keyId,
    key_secret: env.razorpay.keySecret,
  });
};

/**
 * 1. Create a Razorpay Order
 */
export async function createOrder(req, res, next) {
  try {
    const { planId, planName, amount, role } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Valid plan amount is required' });
    }

    const amountInPaise = Math.round(Number(amount) * 100);
    const receipt = `rcpt_${Date.now().toString().slice(-10)}_${Math.floor(Math.random() * 1000)}`;

    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt,
      notes: {
        planId: planId ? String(planId) : 'custom',
        planName: planName || 'LucoHire Plan',
        role: role || (req.user ? req.user.role : 'candidate'),
        userEmail: req.user ? req.user.email : (req.body.userEmail || ''),
      },
    });

    // Save order in database
    const userId = req.user ? req.user.id : null;
    const userEmail = req.user ? req.user.email : (req.body.userEmail || null);
    const userRole = req.user ? req.user.role : (role || 'candidate');

    await pool.query(
      `INSERT INTO payments (user_id, user_email, user_role, plan_id, plan_name, amount, currency, razorpay_order_id, status, receipt)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        userId,
        userEmail,
        userRole,
        planId ? String(planId) : null,
        planName || 'LucoHire Premium Plan',
        amountInPaise,
        'INR',
        order.id,
        'created',
        receipt,
      ]
    );

    return res.status(201).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: env.razorpay.keyId,
      planName: planName || 'LucoHire Plan',
    });
  } catch (err) {
    console.error('[RAZORPAY CREATE ORDER ERROR]', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to create Razorpay order' });
  }
}

/**
 * 2. Verify Razorpay Payment Signature and activate plan
 */
export async function verifyPayment(req, res, next) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planName, planId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing required payment verification parameters',
      });
    }

    // Verify HMAC-SHA256 signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', env.razorpay.keySecret)
      .update(text)
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      console.warn('[RAZORPAY VERIFY FAILED] Signature mismatch:', {
        expected: expectedSignature,
        received: razorpay_signature,
      });

      // Mark payment failed in DB
      await pool.query(
        `UPDATE payments SET status = 'failed', updated_at = now() WHERE razorpay_order_id = $1`,
        [razorpay_order_id]
      ).catch(() => {});

      return res.status(400).json({ success: false, error: 'Payment signature verification failed' });
    }

    // Update payment record to captured
    const paymentResult = await pool.query(
      `UPDATE payments 
       SET status = 'captured', razorpay_payment_id = $1, razorpay_signature = $2, updated_at = now()
       WHERE razorpay_order_id = $3
       RETURNING *`,
      [razorpay_payment_id, razorpay_signature, razorpay_order_id]
    );

    const payment = paymentResult.rows[0];
    const targetPlan = planName || (payment ? payment.plan_name : 'Verified Plan');

    // Upgrade user profile plan in DB by userId or userEmail
    const userId = req.user ? req.user.id : (payment ? payment.user_id : null);
    const userEmail = (req.user && req.user.email) ? req.user.email : (payment ? payment.user_email : null);
    const userRole = req.user ? req.user.role : (payment ? payment.user_role : 'candidate');

    const isAnnual = String(targetPlan).toLowerCase().includes('annual') || String(targetPlan).toLowerCase().includes('year');
    const durationDays = isAnnual ? 365 : 30;

    // Check if user already has an active plan with remaining days so we extend cleanly without losing days
    let baseTime = Date.now();
    const targetTable = (userRole === 'recruiter') ? 'recruiters' : 'candidates';
    let existingRow = null;
    if (userId) {
      const eRes = await pool.query(`SELECT plan_expires_at, is_paid FROM ${targetTable} WHERE id = $1`, [userId]).catch(() => ({ rows: [] }));
      existingRow = eRes.rows[0];
    } else if (userEmail) {
      const eRes = await pool.query(`SELECT plan_expires_at, is_paid FROM ${targetTable} WHERE LOWER(email) = LOWER($1)`, [userEmail]).catch(() => ({ rows: [] }));
      existingRow = eRes.rows[0];
    }

    if (existingRow && existingRow.is_paid && existingRow.plan_expires_at) {
      const existingExpiryTime = new Date(existingRow.plan_expires_at).getTime();
      if (existingExpiryTime > baseTime) {
        baseTime = existingExpiryTime; // extend from current expiration date
      }
    }

    const expiresAt = new Date(baseTime + durationDays * 24 * 60 * 60 * 1000);

    // Update payment record to captured and record expires_at
    await pool.query(
      `UPDATE payments 
       SET expires_at = $1, updated_at = now()
       WHERE razorpay_order_id = $2`,
      [expiresAt, razorpay_order_id]
    ).catch(() => {});

    if (userId) {
      const table = (userRole === 'recruiter') ? 'recruiters' : 'candidates';
      await pool.query(
        `UPDATE ${table} 
         SET is_paid = true, plan = $1, plan_expires_at = $2, auto_renew = true, last_renewed_at = now() 
         WHERE id = $3`,
        [targetPlan, expiresAt, userId]
      ).catch((e) => console.warn(`Could not update ${table} is_paid by id:`, e));
    }
    if (userEmail) {
      await pool.query(
        `UPDATE candidates 
         SET is_paid = true, plan = $1, plan_expires_at = $2, auto_renew = true, last_renewed_at = now() 
         WHERE LOWER(email) = LOWER($3)`,
        [targetPlan, expiresAt, userEmail]
      ).catch((e) => console.warn('Could not update candidate is_paid by email:', e));
      await pool.query(
        `UPDATE recruiters 
         SET is_paid = true, plan = $1, plan_expires_at = $2, auto_renew = true, last_renewed_at = now() 
         WHERE LOWER(email) = LOWER($3)`,
        [targetPlan, expiresAt, userEmail]
      ).catch((e) => console.warn('Could not update recruiter is_paid by email:', e));
    }

    return res.json({
      success: true,
      message: 'Payment verified and plan activated successfully!',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      plan: targetPlan,
      expiresAt: expiresAt.toISOString(),
      autoRenew: true,
      daysRemaining: durationDays,
    });
  } catch (err) {
    console.error('[RAZORPAY VERIFY ERROR]', err);
    return res.status(500).json({ success: false, error: err.message || 'Payment verification failed' });
  }
}

/**
 * 3. Get Public Razorpay Key ID
 */
export async function getRazorpayKey(req, res) {
  return res.json({
    keyId: env.razorpay.keyId,
  });
}

/**
 * Helper: Sync and evaluate subscription validity, expiry, and auto-renew
 */
export async function syncAndProcessUserSubscription(user, role) {
  if (!user) return null;
  const table = role === 'recruiter' ? 'recruiters' : 'candidates';
  const now = new Date();

  // Find latest captured/paid payment
  const pRes = await pool.query(
    `SELECT id, plan_name, plan_id, amount, currency, status, razorpay_order_id, razorpay_payment_id, receipt, is_auto_renew, expires_at, created_at, updated_at
     FROM payments
     WHERE ((user_id IS NOT NULL AND user_id = $1) OR (user_email IS NOT NULL AND LOWER(user_email) = LOWER($2)))
       AND status IN ('captured', 'paid', 'completed')
     ORDER BY created_at DESC
     LIMIT 1`,
    [user.id, user.email]
  ).catch(() => ({ rows: [] }));

  const latestPayment = pRes.rows[0];

  // If user has no payment and is_paid is not true:
  if (!latestPayment && !user.is_paid) {
    return {
      isPaid: false,
      activePlan: null,
      planExpiresAt: null,
      autoRenew: false,
      daysRemaining: 0,
      isExpired: false,
      renewedNow: false,
    };
  }

  let activePlanName = user.plan || (latestPayment ? latestPayment.plan_name : 'LucoHire Pro');
  if (activePlanName === 'Paid (RECOMMENDED)' || activePlanName === 'Paid') {
    activePlanName = 'LucoHire Pro';
  }

  const isAnnual = String(activePlanName).toLowerCase().includes('annual') || String(activePlanName).toLowerCase().includes('year');
  const durationDays = isAnnual ? 365 : 30;

  // Determine expiration date
  let planExpiresAt = user.plan_expires_at ? new Date(user.plan_expires_at) : null;
  if (!planExpiresAt && latestPayment) {
    const paymentDate = new Date(latestPayment.created_at || Date.now());
    planExpiresAt = new Date(paymentDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
  } else if (!planExpiresAt) {
    planExpiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
  }

  // Auto-renew defaults to true for active subscribers unless explicitly disabled (false)
  const autoRenew = user.auto_renew !== false;
  let isPaid = true;
  let isExpired = false;
  let renewedNow = false;

  // Check if current plan has expired
  if (planExpiresAt <= now) {
    if (autoRenew) {
      // AUTO-SUBSCRIPTION / RENEWAL TRIGGERED
      const newExpiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
      const renewAmount = latestPayment?.amount || (isAnnual ? 14900 : 4900);
      const receipt = `auto_sub_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const autoOrderId = `auto_ord_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const autoPayId = `auto_pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      await pool.query(
        `INSERT INTO payments (user_id, user_email, user_role, plan_id, plan_name, amount, currency, razorpay_order_id, razorpay_payment_id, status, receipt, is_auto_renew, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, $12)`,
        [
          user.id,
          user.email,
          role,
          latestPayment?.plan_id || 'pro',
          activePlanName,
          renewAmount,
          'INR',
          autoOrderId,
          autoPayId,
          'captured',
          receipt,
          newExpiresAt,
        ]
      ).catch((err) => console.warn('Could not record auto-renew payment:', err.message));

      await pool.query(
        `UPDATE ${table}
         SET is_paid = true, plan = $1, plan_expires_at = $2, auto_renew = true, last_renewed_at = now()
         WHERE id = $3`,
        [activePlanName, newExpiresAt, user.id]
      ).catch((err) => console.warn('Could not update user after auto-renew:', err.message));

      planExpiresAt = newExpiresAt;
      isPaid = true;
      renewedNow = true;
    } else {
      // User opted out / cancelled auto-renew -> plan expires
      await pool.query(
        `UPDATE ${table}
         SET is_paid = false
         WHERE id = $1`,
        [user.id]
      ).catch((err) => console.warn('Could not expire user subscription:', err.message));

      isPaid = false;
      isExpired = true;
    }
  } else {
    // Subscription still within valid period
    if (!user.is_paid || !user.plan_expires_at) {
      await pool.query(
        `UPDATE ${table}
         SET is_paid = true, plan = $1, plan_expires_at = $2, auto_renew = $3
         WHERE id = $4`,
        [activePlanName, planExpiresAt, autoRenew, user.id]
      ).catch(() => {});
    }
  }

  const daysRemaining = isPaid
    ? Math.max(0, Math.ceil((planExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    isPaid,
    activePlan: isPaid ? activePlanName : null,
    planExpiresAt: planExpiresAt.toISOString(),
    autoRenew,
    daysRemaining,
    isExpired,
    renewedNow,
  };
}

/**
 * 4. Get User's Payments & Subscription Status
 */
export async function getUserPayments(req, res) {
  try {
    const userId = req.user ? req.user.id : null;
    let userEmail = (req.user && req.user.email) ? req.user.email : (req.query.email ? String(req.query.email).toLowerCase().trim() : null);

    if (!userEmail && userId) {
      const uRes = await pool.query('SELECT email FROM candidates WHERE id = $1 UNION SELECT email FROM recruiters WHERE id = $1', [userId]).catch(() => ({ rows: [] }));
      if (uRes.rows.length > 0 && uRes.rows[0].email) {
        userEmail = uRes.rows[0].email.toLowerCase().trim();
      }
    }

    if (!userId && !userEmail) {
      return res.status(401).json({ success: false, error: 'Authentication or user email required' });
    }

    let userRow = null;
    let role = (req.user && req.user.role) ? req.user.role : 'candidate';

    if (userId) {
      const table = role === 'recruiter' ? 'recruiters' : 'candidates';
      const uRes = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [userId]).catch(() => ({ rows: [] }));
      userRow = uRes.rows[0] || null;
    }
    if (!userRow && userEmail) {
      const cRes = await pool.query(`SELECT * FROM candidates WHERE LOWER(email) = LOWER($1)`, [userEmail]).catch(() => ({ rows: [] }));
      if (cRes.rows.length > 0) {
        userRow = cRes.rows[0];
        role = 'candidate';
      } else {
        const rRes = await pool.query(`SELECT * FROM recruiters WHERE LOWER(email) = LOWER($1)`, [userEmail]).catch(() => ({ rows: [] }));
        if (rRes.rows.length > 0) {
          userRow = rRes.rows[0];
          role = 'recruiter';
        }
      }
    }

    // Process subscription expiry and auto-renew evaluation
    let subStatus = null;
    if (userRow) {
      subStatus = await syncAndProcessUserSubscription(userRow, role);
    }

    // Fetch payment records
    const result = await pool.query(
      `SELECT id, plan_name, plan_id, amount, currency, status, razorpay_order_id, razorpay_payment_id, receipt, is_auto_renew, expires_at, created_at, updated_at 
       FROM payments 
       WHERE (user_id IS NOT NULL AND user_id = $1) OR (user_email IS NOT NULL AND LOWER(user_email) = LOWER($2))
       ORDER BY created_at DESC`,
      [userId, userEmail]
    );

    const isPaymentSuccessful = (status) => {
      const s = String(status || '').toLowerCase().trim();
      return s === 'paid' || s === 'captured' || s === 'completed' || s === 'authorized';
    };

    const latestCaptured = result.rows.find(p => isPaymentSuccessful(p.status));

    // Fallback if userRow was not found in candidates/recruiters but payments exist
    let isPaid = subStatus ? subStatus.isPaid : false;
    let activePlan = subStatus ? subStatus.activePlan : null;
    let autoRenew = subStatus ? subStatus.autoRenew : true;
    let planExpiresAt = subStatus ? subStatus.planExpiresAt : null;
    let daysRemaining = subStatus ? subStatus.daysRemaining : 0;
    let isExpired = subStatus ? subStatus.isExpired : false;
    let renewedNow = subStatus ? subStatus.renewedNow : false;

    if (!userRow && latestCaptured) {
      isPaid = true;
      activePlan = latestCaptured.plan_name || 'LucoHire Pro';
      const createdDate = new Date(latestCaptured.created_at || Date.now());
      planExpiresAt = new Date(createdDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      daysRemaining = Math.max(0, Math.ceil((new Date(planExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    }

    if (activePlan === 'Paid (RECOMMENDED)' || activePlan === 'Paid') {
      activePlan = 'LucoHire Pro';
    }

    return res.json({
      success: true,
      activePlan,
      isPaid: Boolean(isPaid),
      planExpiresAt,
      autoRenew,
      daysRemaining,
      isExpired,
      renewedNow,
      payments: result.rows,
      latestPayment: latestCaptured || result.rows[0] || null
    });
  } catch (err) {
    console.error('Error in getUserPayments:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch payments' });
  }
}

/**
 * 5. Toggle or Cancel Auto-Subscription
 */
export async function toggleAutoRenew(req, res) {
  try {
    const { autoRenew, email } = req.body;
    const userId = req.user ? req.user.id : null;
    let userEmail = (req.user && req.user.email) ? req.user.email : (email ? String(email).toLowerCase().trim() : null);

    if (!userEmail && userId) {
      const uRes = await pool.query('SELECT email FROM candidates WHERE id = $1 UNION SELECT email FROM recruiters WHERE id = $1', [userId]).catch(() => ({ rows: [] }));
      if (uRes.rows.length > 0 && uRes.rows[0].email) {
        userEmail = uRes.rows[0].email.toLowerCase().trim();
      }
    }

    if (!userId && !userEmail) {
      return res.status(401).json({ success: false, error: 'Authentication or user email required' });
    }

    const newAutoRenew = Boolean(autoRenew);

    if (userId) {
      const table = (req.user && req.user.role === 'recruiter') ? 'recruiters' : 'candidates';
      await pool.query(`UPDATE ${table} SET auto_renew = $1 WHERE id = $2`, [newAutoRenew, userId]).catch(() => {});
    }
    if (userEmail) {
      await pool.query(`UPDATE candidates SET auto_renew = $1 WHERE LOWER(email) = LOWER($2)`, [newAutoRenew, userEmail]).catch(() => {});
      await pool.query(`UPDATE recruiters SET auto_renew = $1 WHERE LOWER(email) = LOWER($2)`, [newAutoRenew, userEmail]).catch(() => {});
    }

    let userRow = null;
    if (userId) {
      const table = (req.user && req.user.role === 'recruiter') ? 'recruiters' : 'candidates';
      const r = await pool.query(`SELECT id, is_paid, plan, plan_expires_at, auto_renew FROM ${table} WHERE id = $1`, [userId]).catch(() => ({ rows: [] }));
      userRow = r.rows[0];
    } else if (userEmail) {
      const r = await pool.query(`SELECT id, is_paid, plan, plan_expires_at, auto_renew FROM candidates WHERE LOWER(email) = LOWER($1)`, [userEmail]).catch(() => ({ rows: [] }));
      userRow = r.rows[0];
      if (!userRow) {
        const r2 = await pool.query(`SELECT id, is_paid, plan, plan_expires_at, auto_renew FROM recruiters WHERE LOWER(email) = LOWER($1)`, [userEmail]).catch(() => ({ rows: [] }));
        userRow = r2.rows[0];
      }
    }

    const expiresAt = userRow?.plan_expires_at;
    const formattedDate = expiresAt
      ? new Date(expiresAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'the end of your billing cycle';

    const message = newAutoRenew
      ? `Auto-subscription has been turned on. Your plan will automatically renew on ${formattedDate}.`
      : `Auto-subscription has been cancelled. Your current plan benefits remain active until ${formattedDate}, and you will not be charged or renewed automatically.`;

    return res.json({
      success: true,
      autoRenew: newAutoRenew,
      plan: userRow?.plan || null,
      expiresAt: userRow?.plan_expires_at || null,
      message,
    });
  } catch (err) {
    console.error('Error in toggleAutoRenew:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to update auto-subscription setting' });
  }
}

/**
 * 6. Background Worker: Process all expired subscriptions
 */
export async function processAllDueSubscriptions() {
  const now = new Date();
  for (const table of ['candidates', 'recruiters']) {
    const role = table === 'recruiters' ? 'recruiter' : 'candidate';
    const { rows } = await pool.query(
      `SELECT * FROM ${table} WHERE is_paid = true AND plan_expires_at IS NOT NULL AND plan_expires_at <= $1`,
      [now]
    ).catch(() => ({ rows: [] }));

    for (const user of rows) {
      try {
        await syncAndProcessUserSubscription(user, role);
      } catch (err) {
        console.warn(`[Auto-Renew Worker] Failed for ${table} ${user.id}:`, err.message);
      }
    }
  }
}

