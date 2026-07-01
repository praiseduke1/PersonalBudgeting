export async function fetchWithTimeout<T>(
  promise: Promise<T>,
  ms = 10000,
  label = ''
): Promise<T> {
  const timer = label ? `${label}_${Date.now()}` : ''
  if (timer) console.time(timer)

  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Request timeout after ${ms}ms${label ? ': ' + label : ''}`)), ms)
    ),
  ]).finally(() => {
    if (timer) console.timeEnd(timer)
  }) as Promise<T>
}

export async function supabaseQuery<T>(
  query: Promise<{ data: T | null; error: any }>,
  ms = 10000,
  label = ''
): Promise<{ data: T | null; error: any }> {
  try {
    const result = await fetchWithTimeout(query, ms, label)
    return result
  } catch (err: any) {
    return { data: null, error: err }
  }
}
