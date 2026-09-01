import { apiRequest, ApiError } from './client';
import { AuthResponse } from '../types';

export async function register(email: string, password: string): Promise<AuthResponse> {
  try {
    const res = await apiRequest<{ data: AuthResponse }>('/auth/register', {
      method: 'POST',
      body: { email, password },
    });
    return res.data;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError('Registration failed', 0);
  }
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  try {
    const res = await apiRequest<{ data: AuthResponse }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    return res.data;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError('Login failed', 0);
  }
}
