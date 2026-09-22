import type { ApiClient } from "@/lib/api/client";
import { RealApiAdapter } from "@/lib/api/real-adapter";

export const api: ApiClient = new RealApiAdapter();

export * from "@/lib/api/client";
