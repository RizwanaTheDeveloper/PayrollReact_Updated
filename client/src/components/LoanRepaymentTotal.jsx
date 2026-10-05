const money = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 2,
}).format(value);

export default function LoanRepaymentTotal({ total, instalment, count }) {
  const totalPaise = Math.round(Number(total || 0) * 100);
  const monthlyPaise = Math.round(Number(instalment || 0) * 100);
  const months = Number(count) || (monthlyPaise > 0 ? Math.ceil(totalPaise / monthlyPaise) : 0);
  const finalPaise = totalPaise - monthlyPaise * Math.max(months - 1, 0);
  const breakdown = months > 0 && monthlyPaise > 0 && finalPaise > 0
    ? finalPaise === monthlyPaise
      ? `${months} instalments × ${money(monthlyPaise / 100)}`
      : `${months - 1} instalments × ${money(monthlyPaise / 100)} + final instalment ${money(finalPaise / 100)}`
    : '';

  return <>{money(totalPaise / 100)}{breakdown && <small style={{ display: 'block' }}>{breakdown} = {money(totalPaise / 100)}</small>}</>;
}
