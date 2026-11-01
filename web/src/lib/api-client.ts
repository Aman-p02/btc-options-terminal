/**
 * Server-Side Analytics API Client.
 * All requests to Python FastAPI service pass through here with shared-secret verification.
 * Client components never call the Python API directly.
 */

const ANALYTICS_API_URL = process.env.ANALYTICS_API_URL || "http://127.0.0.1:8000";
const INTERNAL_SECRET = process.env.ANALYTICS_API_SECRET || "super-secret-internal-terminal-key-2026";

export async function fetchFromAnalytics<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST';
    body?: any;
    revalidate?: number;
  } = {}
): Promise<T> {
  const url = `${ANALYTICS_API_URL}${endpoint}`;
  const { method = 'GET', body, revalidate = 60 } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-internal-secret': INTERNAL_SECRET,
  };

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    next: { revalidate },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Analytics API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

