import { getToken } from './tokenStore';

/**
 * Backend base URL.
 * - Android emulator: 10.0.2.2 maps to host localhost
 * - iOS simulator / web: localhost works
 * - Physical device: use your machine's LAN IP
 */
export const API_BASE_URL = 'http://192.168.209.86:3000';

export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  /** Use FormData for multipart uploads */
  formData?: FormData;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers, formData } = options;

  const finalHeaders: Record<string, string> = {
    ...(formData ? {} : { 'Content-Type': 'application/json' }),
    ...headers,
  };

  const token = await getToken();
  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  const isForm = !!formData;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: finalHeaders,
      body: isForm ? formData : body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new ApiError(
      `Network error: unable to reach ${API_BASE_URL}. Check that the backend is running.`,
      0
    );
  }

  let payload: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'message' in payload
        ? String((payload as { message: unknown }).message)
        : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}
