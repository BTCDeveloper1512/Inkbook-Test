import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const DEFAULT_API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
export const API_BASE = DEFAULT_API_URL;
// On web the app is served through the craco proxy which routes /api/* to the backend.
// Using a relative URL keeps the request same-site so SameSite=Lax cookies work correctly.
export const API_URL = Platform.OS === 'web' ? '/api' : `${API_BASE}/api`;

async function getToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return null;
    }
    return await SecureStore.getItemAsync('access_token');
  } catch {
    return null;
  }
}

export async function saveToken(cookieHeader: string | string[] | null | undefined) {
  if (!cookieHeader || Platform.OS === 'web') return;
  const cookies = Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];
  for (const cookie of cookies) {
    const match = cookie.match(/access_token=([^;]+)/);
    if (match) {
      await SecureStore.setItemAsync('access_token', match[1]);
      return;
    }
  }
}

export async function clearToken() {
  if (Platform.OS === 'web') return;
  try {
    await SecureStore.deleteItemAsync('access_token');
  } catch {}
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Cookie'] = `access_token=${token}`;
  }

  const url = path.startsWith('http') ? path : `${API_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    await saveToken(setCookie);
  }

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const err = await response.json();
      detail = err.detail || err.message || detail;
    } catch {}
    throw new Error(detail);
  }

  const text = await response.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

export async function apiGet<T = unknown>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: 'GET' });
}

export async function apiPost<T = unknown>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function apiPut<T = unknown>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: 'PUT',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function apiDelete<T = unknown>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: 'DELETE' });
}
