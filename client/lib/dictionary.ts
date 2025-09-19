const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchWithTimeout(
  input: RequestInfo,
  init: RequestInit = {},
  timeout = 8000,
) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(input, { signal: controller.signal, ...init });
    return res;
  } finally {
    clearTimeout(id);
  }
}

export async function fetchDefinitions(
  words: string[],
): Promise<Record<string, string>> {
  if (!words || words.length === 0) return {};
  const payload = { words };
  const maxRetries = 2;
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      const res = await fetchWithTimeout(
        `/api/define`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
        8000,
      );

      if (!res) return {};
      if (!res.ok) {
        // Non-2xx responses — do not throw, return empty definitions
        return {};
      }

      const data = await res.json();
      return data.definitions ?? {};
    } catch (err: any) {
      // Quietly handle network errors (avoid noisy stack traces in console)
      console.debug(
        `fetchDefinitions attempt ${attempt} failed: ${String(err?.message ?? err)}`,
      );
      attempt++;
      if (attempt > maxRetries) return {};
      await sleep(300 * attempt);
    }
  }
  return {};
}
