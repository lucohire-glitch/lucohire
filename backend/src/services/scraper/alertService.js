import { ScraperModel } from '../../models/scraperModel.js';

export const ScraperAlertService = {
  /**
   * Evaluates a completed scan against historical metrics and triggers alerts if:
   * 1. Count dropped by 30%+
   * 2. Active jobs dropped to 0 (Critical)
   * 3. Discrepancy between reported portal total and extracted total
   * 4. Auto-resolves active alerts if count has recovered
   */
  async evaluateScan({ companyId, companyName, previousCount = 0, currentExtracted = 0, reportedCount = 0, scanStatus = 'PASS', coverage = 'COMPLETE' }) {
    const alertsGenerated = [];

    // Condition 1: Active Jobs Dropped to 0 (Critical)
    if (previousCount > 0 && currentExtracted === 0) {
      const alert = await ScraperModel.createAlert({
        companyId,
        companyName,
        alertType: 'ZERO_JOBS',
        severity: 'CRITICAL',
        previousCount,
        currentCount: 0,
        percentageDrop: 100,
        message: `🚨 CRITICAL ALERT: Job count collapsed from ${previousCount.toLocaleString()} to 0 for ${companyName}! Zero-Job Safety engaged to protect existing jobs. Check if portal URL changed, blocked by WAF, or site is offline.`,
        metadata: {
          previousCount,
          currentExtracted,
          reportedCount,
          scanStatus,
          timestamp: new Date().toISOString()
        }
      });
      alertsGenerated.push(alert);
      console.warn(`[WATCHDOG ALERT] ZERO_JOBS triggered for ${companyName}`);
    }

    // Condition 2: Sudden Drop of 30% or more (Warning)
    if (previousCount >= 10 && currentExtracted > 0 && currentExtracted < previousCount) {
      const dropPct = Number((((previousCount - currentExtracted) / previousCount) * 100).toFixed(1));
      if (dropPct >= 30) {
        const alert = await ScraperModel.createAlert({
          companyId,
          companyName,
          alertType: 'COUNT_DROP_30',
          severity: 'WARNING',
          previousCount,
          currentCount: currentExtracted,
          percentageDrop: dropPct,
          message: `⚠️ SUDDEN DROP ALERT: Job count dropped by ${dropPct}% for ${companyName} (from ${previousCount.toLocaleString()} down to ${currentExtracted.toLocaleString()} jobs). Check if pagination capped or filters need tuning.`,
          metadata: {
            previousCount,
            currentExtracted,
            dropPct,
            reportedCount,
            scanStatus,
            timestamp: new Date().toISOString()
          }
        });
        alertsGenerated.push(alert);
        console.warn(`[WATCHDOG ALERT] COUNT_DROP_30 (${dropPct}%) triggered for ${companyName}`);
      }
    }

    // Condition 3: Discrepancy between Portal Total and Extracted Jobs (Warning)
    if (reportedCount > 0 && currentExtracted < (reportedCount * 0.95)) {
      const missingCount = reportedCount - currentExtracted;
      const discrepancyPct = Number((((reportedCount - currentExtracted) / reportedCount) * 100).toFixed(1));
      const alert = await ScraperModel.createAlert({
        companyId,
        companyName,
        alertType: 'COUNT_DISCREPANCY',
        severity: 'WARNING',
        previousCount: reportedCount,
        currentCount: currentExtracted,
        percentageDrop: discrepancyPct,
        message: `⚠️ ACCURACY DISCREPANCY: Official portal reports ${reportedCount.toLocaleString()} jobs, but extracted ${currentExtracted.toLocaleString()} (${missingCount.toLocaleString()} missing). Split query or pagination retry needed.`,
        metadata: {
          reportedCount,
          currentExtracted,
          missingCount,
          discrepancyPct,
          scanStatus,
          timestamp: new Date().toISOString()
        }
      });
      alertsGenerated.push(alert);
      console.warn(`[WATCHDOG ALERT] COUNT_DISCREPANCY (${missingCount} missing) for ${companyName}`);
    }

    // Condition 4: Auto-Recovery
    // If the company count is healthy and matches expected count, resolve prior active alerts!
    if (currentExtracted >= previousCount * 0.9 && (reportedCount === 0 || currentExtracted >= reportedCount * 0.95) && currentExtracted > 0) {
      const resolved = await ScraperModel.resolveAlertsForCompany(companyId);
      if (resolved.length > 0) {
        console.log(`[WATCHDOG RESOLVED] Auto-resolved ${resolved.length} active alerts for ${companyName} (Count healthy at ${currentExtracted.toLocaleString()})`);
      }
    }

    return alertsGenerated;
  },

  /**
   * Get all active alerts and stats
   */
  async getAlertsSummary() {
    const stats = await ScraperModel.getAlertStats();
    const activeAlerts = await ScraperModel.getAlerts({ status: 'ACTIVE', limit: 25 });
    return {
      stats,
      alerts: activeAlerts
    };
  }
};

