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

    // If user is authenticated, upgrade their profile plan in DB
    const userId = req.user ? req.user.id : (payment ? payment.user_id : null);
    const userRole = req.user ? req.user.role : (payment ? payment.user_role : null);

    if (userId && userRole === 'candidate') {
      await pool.query(
        `UPDATE candidates SET is_paid = true, plan = $1 WHERE id = $2`,
        [targetPlan, userId]
      ).catch((e) => console.warn('Could not update candidate is_paid:', e));
    } else if (userId && userRole === 'recruiter') {
      await pool.query(
        `UPDATE recruiters SET is_paid = true, plan = $1 WHERE id = $2`,
        [targetPlan, userId]
      ).catch((e) => console.warn('Could not update recruiter is_paid:', e));
    }

    return res.json({
      success: true,
      message: 'Payment verified and plan activated successfully!',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      plan: targetPlan,
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
 * 4. Get User's Payments
 */
export async function getUserPayments(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const result = await pool.query(
      `SELECT id, plan_name, amount, currency, status, razorpay_payment_id, created_at 
       FROM payments 
       WHERE user_id = $1 OR user_email = $2 
       ORDER BY created_at DESC`,
      [req.user.id, req.user.email]
    );
    return res.json({ payments: result.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch payments' });
  }
}

