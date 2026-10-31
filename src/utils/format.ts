export const numberFormatter = new Intl.NumberFormat('fa-IR', {
  maximumFractionDigits: 0,
});

export const dateFormatter = new Intl.DateTimeFormat('fa-IR', {
  dateStyle: 'short',
  timeStyle: 'short',
});