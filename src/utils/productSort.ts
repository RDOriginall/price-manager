import type { Product } from '../types/models';

const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

/**
 * Orders products by code in natural order: numbers first from smallest to largest
 * (1, 2, 10), then letters A to Z (A1, A2, A10). Products without a code come last.
 */
export function compareProductsByCode(a: Product, b: Product): number {
  const codeA = a.code?.trim() ?? '';
  const codeB = b.code?.trim() ?? '';

  if (!codeA && !codeB) return collator.compare(a.name, b.name);
  if (!codeA) return 1;
  if (!codeB) return -1;

  return collator.compare(codeA, codeB) || collator.compare(a.name, b.name);
}
