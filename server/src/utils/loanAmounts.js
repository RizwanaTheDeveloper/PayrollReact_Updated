// Calculate in integer paise to match PostgreSQL NUMERIC rounding exactly.
function hundredths(value) {
  const [whole, fraction = ''] = String(value).split('.');
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
}

function loanAmounts(amount, percentage, instalmentCount = null) {
  const principal = hundredths(amount);
  const monthlyInterest = (principal * hundredths(percentage) + 5000n) / 10000n;
  // Records without a count retain their original one-time interest terms.
  const count = BigInt(instalmentCount ?? 1);
  const interest = monthlyInterest * count;
  return { interest: Number(interest) / 100, total: Number(principal + interest) / 100,
    monthlyPrincipal: Number(principal / count) / 100,
    monthlyInterest: Number(monthlyInterest) / 100,
    instalment: Number(principal / count + monthlyInterest) / 100 };
}

module.exports = loanAmounts;
