export function loanAmounts(amount, percentage, instalmentCount = 1) {
  const valid = (value) => /^\d+(?:\.\d{1,2})?$/.test(String(value));
  if (!valid(amount) || !valid(percentage) || !/^\d+$/.test(String(instalmentCount))
    || Number(instalmentCount) < 1 || Number(instalmentCount) > 360) {
    return { interest: 0, total: 0, monthlyPrincipal: 0, monthlyInterest: 0, instalment: 0 };
  }
  const hundredths = (value) => {
    const [whole, fraction = ''] = String(value).split('.');
    return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  };
  const principal = hundredths(amount);
  const monthlyInterest = (principal * hundredths(percentage) + 5000n) / 10000n;
  const count = BigInt(instalmentCount);
  const interest = monthlyInterest * count;
  return { interest: Number(interest) / 100, total: Number(principal + interest) / 100,
    monthlyPrincipal: Number(principal / count) / 100,
    monthlyInterest: Number(monthlyInterest) / 100,
    instalment: Number(principal / count + monthlyInterest) / 100 };
}
