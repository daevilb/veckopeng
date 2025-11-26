// src/services/securedApi.ts

// Vi tvingar typen till 'any' för att slippa bråk med TypeScript om 'env'
const API_BASE_URL: string =
  (import.meta as any).env?.VITE_API_BASE_URL || '';

function getFamilyKey(): string | null {
  return localStorage.getItem('veckopeng.familyKey');
}

export async function securedFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  // Om path redan börjar med http (t.ex. full url) så använd den, annars lägg på base
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const familyKey = getFamilyKey();
  if (familyKey) {
    headers['x-family-key'] = familyKey;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error('AUTH_ERROR');
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}