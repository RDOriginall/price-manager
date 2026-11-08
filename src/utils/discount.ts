import { normalizeNumberInput } from './price';

export type DiscountMode = 'percent' | 'amount' | 'finalAmount';

/**
 * Turns what the seller typed into a discount in whole Toman for a sale line.
 *
 * - percent: a percentage of the line total (for example 10 or 12.5)
 * - amount: the discount itself
 * - finalAmount: the amount the customer will pay; the discount is the difference
 *
 * An empty input means no discount.
 */
export function calculateDiscountToman(
  mode: DiscountMode,
  input: string,
  lineTotalToman: number,
): number {
  const value = normalizeNumberInput(input).replace('٫', '.');

  if (value === '') return 0;

  if (mode === 'percent') {
    if (!/^\d+(?:\.\d{1,2})?$/.test(value) || Number(value) > 100) {
      throw new Error('درصد تخفیف باید عددی بین ۰ تا ۱۰۰ باشد.');
    }

    return Math.round((lineTotalToman * Number(value)) / 100);
  }

  if (!/^\d+$/.test(value)) {
    throw new Error('مبلغ باید عدد صحیح و مثبت باشد.');
  }

  const amount = Number(value);

  if (!Number.isSafeInteger(amount) || amount > lineTotalToman) {
    throw new Error(
      mode === 'amount'
        ? 'مبلغ تخفیف نمی‌تواند از مبلغ کل بیشتر باشد.'
        : 'مبلغ نهایی نمی‌تواند از مبلغ کل بیشتر باشد.',
    );
  }

  return mode === 'amount' ? amount : lineTotalToman - amount;
}
