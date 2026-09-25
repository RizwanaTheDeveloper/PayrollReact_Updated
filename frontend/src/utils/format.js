export const formatDate=(v,opts={day:'2-digit',month:'short',year:'numeric'})=>v?new Date(v).toLocaleDateString('en-GB',opts):'—';
export function formatINR(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}