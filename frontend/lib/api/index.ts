import type { ApiClient } from "@/lib/api/client";
import { MockApiAdapter } from "@/lib/api/mock-adapter";
import { RealApiAdapter } from "@/lib/api/real-adapter";

// Flip NEXT_PUBLIC_USE_MOCK_API=false (and set NEXT_PUBLIC_API_BASE_URL) once
// the real FastAPI backend implements the API/DB spec. Every page imports
// `api` from here — nothing else in the app needs to change.
const useMock = process.env.NEXT_PUBLIC_USE_MOCK_API !== "false";

export const api: ApiClient = useMock ? new MockApiAdapter() : new RealApiAdapter();
export const isMockApi = useMock;

export * from "@/lib/api/client";
