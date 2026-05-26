import { z } from "zod";

export const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(10000),
});

export const BuilderChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1),
  model: z.enum(["lite", "standard", "opus"]).optional().default("standard"),
});

export const DeployFileSchema = z.object({
  path: z.string().min(1),
  content: z.string(),
  language: z.string().optional(),
});

export const BuilderDeployRequestSchema = z.object({
  files: z.array(DeployFileSchema).min(1),
  projectName: z.string().min(1).max(100).optional(),
});

export const PurchaseCheckoutSchema = z.object({
  packId: z.string().min(1),
});

export const VercelDomainSchema = z.object({
  domain: z.string().min(1),
});

export const VercelEnvCreateSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
  target: z.array(z.string()).nonempty().optional(),
});

export const VercelEnvDeleteSchema = z.object({
  id: z.string().min(1),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type BuilderChatRequest = z.infer<typeof BuilderChatRequestSchema>;
export type DeployFile = z.infer<typeof DeployFileSchema>;
export type BuilderDeployRequest = z.infer<typeof BuilderDeployRequestSchema>;
