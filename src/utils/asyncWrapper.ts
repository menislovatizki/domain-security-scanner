type AsyncFunction<T> = (...args: any[]) => Promise<T>;

export const asyncWrapper = <T>(fn: AsyncFunction<T>) => async (...args: any[]): Promise<{ result: T | null; error: Error | null }> => {
  try {
    const result = await fn(...args);
    return { result, error: null };
  } catch (error) {
    return { result: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
};