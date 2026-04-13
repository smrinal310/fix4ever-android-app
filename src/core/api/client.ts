import { config } from '../config';

export type ApiError = { message: string; success?: boolean };

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: object;
}

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<{ data?: T; error?: ApiError }> {
  const base = config.API_BASE_URL;
  const { body, headers: customHeaders, ...rest } = options;
  const headers: Record<string, string> = {
    ...(customHeaders as Record<string, string>),
  };
  try {
    const res = await fetch(`${base}${path}`, {
      ...rest,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message =
        typeof (json as any)?.message === 'string'
          ? (json as any).message
          : `Request failed (${res.status})`;
      return {
        error: {
          message,
          success: (json as any)?.success,
        },
      };
    }
    return { data: json as T };
  } catch (e: any) {
    return {
      error: {
        message: e?.message || 'Network error. Please check your connection.',
      },
    };
  }
}

export async function requestWithAuth<T>(
  path: string,
  token: string,
  options: RequestOptions = {}
): Promise<{ data?: T; error?: ApiError }> {
  console.log("requestWithAuth", path, token, options)
  return request<T>(path, {
    ...options,
    headers: {
      ...(options.headers as object),
      Authorization: `Bearer ${token}`,
    },
  });
}

export { request };
