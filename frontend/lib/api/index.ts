import type { ApiClient } from "@/lib/api/client";
import { MockApiAdapter } from "@/lib/api/mock-adapter";
import { RealApiAdapter } from "@/lib/api/real-adapter";

const useMock = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";

export const api: ApiClient = useMock ? new MockApiAdapter() : new RealApiAdapter();
export const isMockApi = useMock;

export * from "@/lib/api/client";
