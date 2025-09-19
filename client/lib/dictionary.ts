export async function fetchDefinitions(words: string[]): Promise<Record<string, string>> {
  if (!words || words.length === 0) return {};
  try {
    const res = await fetch(`/api/define`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ words }),
    });
    if (!res.ok) return {};
    const data = await res.json();
    return data.definitions ?? {};
  } catch (err) {
    console.error("fetchDefinitions error", err);
    return {};
  }
}
