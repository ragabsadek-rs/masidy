import { z } from "zod";

// ── Builder chat ───────────────────────────────────────────────────────────
export const BuilderChatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().min(1).max(32000),
  })).min(1).max(100),
  model: z.enum(["lite", "standard", "opus"]).default("standard"),
});

// ── Builder deploy ─────────────────────────────────────────────────────────
export const BuilderDeployRequestSchema = z.object({
  files: z.array(z.object({
    path: z.string().min(1).max(500),
    content: z.string().max(500000),
    language: z.string().optional(),
  })).min(1).max(200),
  projectName: z.string().min(1).max(100).optional(),
});

// ── Checkout ───────────────────────────────────────────────────────────────
export const CheckoutRequestSchema = z.object({
  packId: z.enum(["pack_5", "pack_10", "pack_20", "pack_50", "pack_100"]),
});

// ── Domains ────────────────────────────────────────────────────────────────
export const AddDomainSchema = z.object({
  domain: z.string()
    .min(3).max(253)
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9-_.]+\.[a-zA-Z]{2,}$/, "Invalid domain format"),
});

export const DeleteDomainSchema = z.object({
  domain: z.string().min(3).max(253),
});

// ── Environment variables ──────────────────────────────────────────────────
export const CreateEnvVarSchema = z.object({
  key: z.string()
    .min(1).max(256)
    .regex(/^[A-Z0-9_]+$/, "Key must be uppercase letters, numbers, and underscores only"),
  value: z.string().max(32768),
  target: z.array(z.enum(["production", "preview", "development"])).min(1).default(["production", "preview", "development"]),
});

export const DeleteEnvVarSchema = z.object({
  id: z.string().min(1).max(100),
});

// ── Helper ─────────────────────────────────────────────────────────────────
export function parseBody<T>(schema: z.ZodSchema<T>, data: unknown): { data: T; error: null } | { data: null; error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const msg = result.error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join(", ");
    return { data: null, error: msg };
  }
  return { data: result.data, error: null };
}
