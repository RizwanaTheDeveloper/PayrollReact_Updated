export const formatINR=v=>{const n=Number(v);if(Number.isNaN(n))return v;return new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',minimumFractionDigits:2}).format(n)};
export const formatDate=(v,opts={day:'2-digit',month:'short',year:'numeric'})=>v?new Date(v).toLocaleDateString('en-GB',opts):'—';
