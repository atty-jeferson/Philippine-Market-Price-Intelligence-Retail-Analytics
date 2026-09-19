/**
 * THE GROCER - Analytical & Domain Test Suite Runner
 * 
 * Executes deterministic test suites for:
 * 1. Identity Resolution & Data Ingestion (Phase 2)
 * 2. Statistical Engine, Student's t & OLS Diagnostics (Phase 3)
 * 3. Market Signals & Opportunity Detection (Phase 4)
 */

import { runIdentityTests } from './identity.test';
import { runStatisticsTests } from './statistics.test';
import { runSignalsTests } from './signals.test';
import { runCompetitiveTests } from './competitive.test';
import { runAnalyticsTests } from './analytics.test';

async function main() {
  console.log('================================================================');
  console.log('  THE GROCER — HARDENED DOMAIN & ANALYTICAL VERIFICATION SUITE  ');
  console.log('================================================================');

  const identityRes = runIdentityTests();
  const statisticsRes = runStatisticsTests();
  const signalsRes = runSignalsTests();
  const competitiveRes = runCompetitiveTests();
  const analyticsRes = runAnalyticsTests();

  const totalPassed = identityRes.passed + statisticsRes.passed + signalsRes.passed + competitiveRes.passed + analyticsRes.passed;
  const totalFailed = identityRes.failed + statisticsRes.failed + signalsRes.failed + competitiveRes.failed + analyticsRes.failed;
  const allErrors = [...identityRes.errors, ...statisticsRes.errors, ...signalsRes.errors, ...competitiveRes.errors, ...analyticsRes.errors];

  console.log('\n================================================================');
  console.log(`  VERIFICATION SUMMARY: ${totalPassed} PASSED, ${totalFailed} FAILED`);
  console.log('================================================================');

  if (totalFailed > 0) {
    console.error('\nFailures encountered:');
    allErrors.forEach((err) => console.error(err));
    process.exit(1);
  } else {
    console.log('\nAll domain, statistical, identity, and signal tests passed with 100% determinism.');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
