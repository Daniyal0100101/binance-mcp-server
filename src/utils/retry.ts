/**
 * Retry wrapper with exponential backoff for Binance API rate limiting.
 * Retries on error code -1003 (rate limit exceeded) and network errors.
 */
export async function withRetry(
  fn: () => Promise<any>,
  maxRetries: number = 3,
  baseDelay: number = 500
): Promise<any> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      const isRateLimit = error?.code === -1003;
      const isNetworkError = error?.code === 'ECONNRESET' ||
                            error?.code === 'ETIMEDOUT' ||
                            error?.code === 'ENOTFOUND' ||
                            error?.message?.includes('fetch failed');

      if (!isRateLimit && !isNetworkError) {
        throw error;
      }

      if (attempt === maxRetries) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      const jitter = Math.floor(Math.random() * 200);
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
    }
  }

  throw lastError;
}