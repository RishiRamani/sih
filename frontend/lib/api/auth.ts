// frontend/lib/api/auth.ts
import { ApiError } from "@/lib/api/client";
import type {
  BackendRegisterResponse,
  BackendTokenResponse,
  BackendUserResponse,
  LoginPayload,
  RegisterPayload,
  RegisterResponse,
  TokenResponse,
  VerifyOtpPayload,
  AuthUser,
} from "@/lib/types";

export const BASE_URL = process.env.API_BASE_URL ?? "https://qrypta.onrender.com";

async function authRequest<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError(`Could not reach Qrypta backend at ${BASE_URL}${path}.`);
  }

  if (!res.ok) {
    let message = `Request to ${path} failed with status ${res.status}.`;
    try {
      const body = await res.json();
      if (body?.detail) {
        message =
          typeof body.detail === "string"
            ? body.detail
            : JSON.stringify(body.detail);
      }
    } catch {
      /* ignore parse errors */
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function toTokenResponse(raw: BackendTokenResponse): TokenResponse {
  return {
    userId: raw.user_id,
    email: raw.email,
    token: raw.token,
    tokenType: raw.token_type,
  };
}

export async function registerUser(
  payload: RegisterPayload
): Promise<RegisterResponse> {
  const raw = await authRequest<BackendRegisterResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return {
    status: "otp_sent",
    email: raw.email,
    message: raw.message,
  };
}

export async function verifyOtp(
  payload: VerifyOtpPayload
): Promise<TokenResponse> {
  const raw = await authRequest<BackendTokenResponse>("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return toTokenResponse(raw);
}

export async function resendOtp(email: string): Promise<RegisterResponse> {
  const raw = await authRequest<BackendRegisterResponse>(
    "/auth/resend-otp",
    {
      method: "POST",
      body: JSON.stringify({ email }),
    }
  );
  return {
    status: "otp_sent",
    email: raw.email,
    message: raw.message,
  };
}

export async function loginUser(
  payload: LoginPayload
): Promise<TokenResponse> {
  const raw = await authRequest<BackendTokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return toTokenResponse(raw);
}

export async function fetchMe(token: string): Promise<AuthUser> {
  const raw = await authRequest<BackendUserResponse>("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return {
    userId: raw.user_id,
    email: raw.email,
    createdAt: raw.created_at,
    isVerified: raw.is_verified,
  };
}