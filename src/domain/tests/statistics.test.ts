/**
 * Deterministic Test Suite: Statistical Engine & Econometrics
 * 
 * Verifies:
 * - Student's t critical values & p-values (vs standard statistical tables)
 * - Small sample handling (n < 2 returns null CIs, no NaN)
 * - OLS Solver accuracy, variance diagnostics, singularity detection
 * - Price indices (PCI, RPP) mathematical consistency
 */

import {
  studentTCriticalValue,
  studentTPValue,
  calculateConfidenceInterval,
  solveHardenedOLS,
  calculatePCI,
  calculateRPP
} from '../statistics';

export function runStatisticsTests(): { passed: number; failed: number; errors: string[] } {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      passed++;
      console.log(`  ✓ ${testName}`);
    } else {
      failed++;
      const msg = `  ✗ ${testName}${detail ? `: ${detail}` : ''}`;
      errors.push(msg);
      console.error(msg);
    }
  }

  console.log('\n--- Running Statistical Engine & OLS Tests ---');

  // Test 1: Student's t Critical Values at 95% Confidence (two-tailed alpha = 0.05)
  // Standard NIST / textbook values:
  // df = 1: 12.706
  // df = 5: 2.571
  // df = 10: 2.228
  // df = 30: 2.042
  // df = 100: 1.984
  const t_df1 = studentTCriticalValue(1, 0.95);
  assert(
    Math.abs(t_df1 - 12.706) < 0.05,
    `Student's t critical value df=1 (expected ~12.706, got ${t_df1.toFixed(3)})`
  );

  const t_df5 = studentTCriticalValue(5, 0.95);
  assert(
    Math.abs(t_df5 - 2.571) < 0.02,
    `Student's t critical value df=5 (expected ~2.571, got ${t_df5.toFixed(3)})`
  );

  const t_df10 = studentTCriticalValue(10, 0.95);
  assert(
    Math.abs(t_df10 - 2.228) < 0.02,
    `Student's t critical value df=10 (expected ~2.228, got ${t_df10.toFixed(3)})`
  );

  const t_df30 = studentTCriticalValue(30, 0.95);
  assert(
    Math.abs(t_df30 - 2.042) < 0.02,
    `Student's t critical value df=30 (expected ~2.042, got ${t_df30.toFixed(3)})`
  );

  const t_df100 = studentTCriticalValue(100, 0.95);
  assert(
    Math.abs(t_df100 - 1.984) < 0.02,
    `Student's t critical value df=100 (expected ~1.984, got ${t_df100.toFixed(3)})`
  );

  // Test 2: Student's t Two-Tailed p-Values
  const p_zero = studentTPValue(0, 10);
  assert(
    Math.abs(p_zero - 1.0) < 0.001,
    `Student's t p-value at t=0 equals 1.0 (got ${p_zero.toFixed(4)})`
  );

  const p_crit = studentTPValue(2.228, 10);
  assert(
    Math.abs(p_crit - 0.05) < 0.005,
    `Student's t p-value at t_crit for df=10 is ~0.05 (got ${p_crit.toFixed(4)})`
  );

  // Test 3: Confidence Interval Edge Cases
  const ci_n1 = calculateConfidenceInterval(100, 10, 1, 0.95);
  assert(
    ci_n1.ciLower === null && ci_n1.ciUpper === null && ci_n1.isReliable === false,
    'Small sample (n=1): CI correctly returns nulls with isReliable=false'
  );

  const ci_n10 = calculateConfidenceInterval(100, 15, 10, 0.95);
  assert(
    ci_n10.ciLower !== null && ci_n10.ciUpper !== null && ci_n10.df === 9,
    `Valid sample (n=10): CI computed with df=9 (range: [${ci_n10.ciLower?.toFixed(2)}, ${ci_n10.ciUpper?.toFixed(2)}])`
  );

  // Test 4: OLS Solver on Perfect Linear Relationship (y = 2.5x + 10)
  // Design matrix X with column 0 as constant intercept (1) and column 1 as x
  const X_clean = [
    [1, 10],
    [1, 20],
    [1, 30],
    [1, 40],
    [1, 50],
    [1, 60],
    [1, 70],
    [1, 80]
  ];
  const Y_clean = X_clean.map(([, x]) => 2.5 * x + 10);
  const labels = [
    { variable: 'intercept', label: 'Intercept' },
    { variable: 'pack_size', label: 'Pack Size' }
  ];

  const olsResult = solveHardenedOLS(X_clean, Y_clean, labels);
  assert(
    olsResult.status === 'valid',
    `OLS status is valid on well-behaved data (got ${olsResult.status})`
  );
  assert(
    Math.abs(olsResult.coefficients[0].coef - 10) < 0.001,
    `OLS intercept recovers 10.0 (got ${olsResult.coefficients[0]?.coef.toFixed(4)})`
  );
  assert(
    Math.abs(olsResult.coefficients[1].coef - 2.5) < 0.001,
    `OLS slope recovers 2.5 (got ${olsResult.coefficients[1]?.coef.toFixed(4)})`
  );
  assert(
    Math.abs(olsResult.rSquared - 1.0) < 0.001,
    `OLS R-squared is 1.0 on exact linear line (got ${olsResult.rSquared.toFixed(4)})`
  );

  // Test 5: OLS Solver Diagnostics — Zero Variance Regressor
  const X_zero_var = [
    [1, 50],
    [1, 50],
    [1, 50],
    [1, 50],
    [1, 50]
  ];
  const Y_zero_var = [10, 15, 20, 25, 30];
  const olsZeroVar = solveHardenedOLS(X_zero_var, Y_zero_var, labels);
  assert(
    olsZeroVar.status === 'zero_variance' || olsZeroVar.status === 'singular_matrix',
    `OLS detects zero variance without crashing (status: ${olsZeroVar.status})`
  );

  // Test 6: OLS Solver Diagnostics — Insufficient Sample (n <= k)
  const X_under = [[1, 10], [1, 20]];
  const Y_under = [5, 10];
  const olsUnder = solveHardenedOLS(X_under, Y_under, labels);
  assert(
    olsUnder.status === 'insufficient_observations',
    `OLS handles insufficient sample size (n=2 for k=2 returns insufficient_observations)`
  );

  // Test 7: Pricing Index Formulas (PCI & RPP)
  const pci120 = calculatePCI(120, 100);
  assert(
    pci120 === 120,
    `PCI of ₱120 vs ₱100 benchmark is exactly 120 (got ${pci120})`
  );

  const rpp = calculateRPP(120, 100);
  assert(
    rpp === 20,
    `RPP of ₱120 vs ₱100 benchmark is +20% (got ${rpp}%)`
  );

  return { passed, failed, errors };
}
