// Internal types for the browserless ChatGPTClient. Different from the
// Persona types — these are the wire shapes of the OpenAI/Auth0 endpoints.

import { z } from "zod";

export const SessionResponseSchema = z
  .object({
    user: z
      .object({
        id: z.string(),
        name: z.string().nullable().optional(),
        email: z.string().email(),
        image: z.string().url().optional(),
        picture: z.string().url().optional(),
        idp: z.string().optional(),
      })
      .optional(),
    expires: z.string().optional(),
    accessToken: z.string().optional(),
    provider: z.string().optional(),
    userId: z.string().optional(),
    orgId: z.string().optional(),
  })
  .passthrough();

export type SessionResponse = z.infer<typeof SessionResponseSchema>;

export const MeResponseSchema = z
  .object({
    id: z.string(),
    email: z.string().email(),
    name: z.string().nullable().optional(),
    picture: z.string().url().optional(),
    phone_number: z.string().nullable().optional(),
    default_org_id: z.string().optional(),
    account_plan: z
      .object({
        is_paid_subscription_active: z.boolean(),
        subscription_plan: z.enum(["free", "go", "plus", "pro", "team", "enterprise"]),
        account_user_role: z.string().optional(),
        subscription_expires_at: z.string().optional(),
        will_renew: z.boolean().optional(),
        has_premium_access: z.boolean().optional(),
      })
      .passthrough(),
    features: z.array(z.string()).optional(),
    puid: z.string().optional(),
  })
  .passthrough();

export type MeResponse = z.infer<typeof MeResponseSchema>;

export const AccountCheckSchema = z
  .object({
    account_state: z.enum([
      "OK",
      "TRIAL_AVAILABLE",
      "BANNED",
      "RATE_LIMITED",
      "SOFT_BANNED",
      "MFA_REQUIRED",
    ]),
    features: z.array(z.string()).optional(),
    persona_country: z.string().optional(),
    is_phone_verified: z.boolean().optional(),
    is_email_verified: z.boolean().optional(),
  })
  .passthrough();

export type AccountCheck = z.infer<typeof AccountCheckSchema>;

export const ConversationsListSchema = z
  .object({
    items: z
      .array(
        z
          .object({
            id: z.string(),
            title: z.string().nullable().optional(),
            create_time: z.number(),
            update_time: z.number(),
            current_node: z.string().optional(),
            default_model_slug: z.string().optional(),
            is_archived: z.boolean().optional(),
          })
          .passthrough(),
      )
      .default([]),
    total: z.number().default(0),
    limit: z.number().default(20),
    offset: z.number().default(0),
    has_missing_conversations: z.boolean().optional(),
  })
  .passthrough();

export type ConversationsList = z.infer<typeof ConversationsListSchema>;

export const ConversationItemSchema = z
  .object({
    conversationId: z.string(),
    title: z.string(),
    create_time: z.number(),
    update_time: z.number(),
    default_model_slug: z.string().optional(),
  })
  .passthrough();

export const SentinelRequirementsSchema = z
  .object({
    token: z.string(),
    persona: z.string().optional(),
    arkose: z
      .object({
        required: z.boolean(),
        dx: z.unknown().optional(),
      })
      .optional(),
    turnstile: z
      .object({
        required: z.boolean(),
      })
      .optional(),
    proofofwork: z
      .object({
        required: z.boolean(),
        seed: z.string(),
        difficulty: z.string(),
      })
      .optional(),
  })
  .passthrough();

export type SentinelRequirements = z.infer<typeof SentinelRequirementsSchema>;

// An SSE event from POST /backend-api/conversation.
export interface SseEvent {
  /** True for the final `[DONE]` marker. */
  done?: boolean;
  /** Set when the server reports an error mid-stream. */
  error?: unknown;
  conversation_id?: string;
  message?: {
    id: string;
    author?: { role?: string; name?: string };
    content?: { content_type?: string; parts?: unknown[] };
    metadata?: { model_slug?: string; finish_details?: unknown };
  };
}
