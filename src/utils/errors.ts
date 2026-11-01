export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'خطای غیرمنتظره‌ای رخ داد';
}
