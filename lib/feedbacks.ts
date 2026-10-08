import { z } from "zod";

/** Schema Designer / Platform type for Feedbacks records. */
export const FEEDBACKS_TYPE = "designer.feedbacks";

export const FeedbackType = z.enum(["issue", "feature_request", "feedback"]);
export const FeedbackPriority = z.enum(["low", "medium", "high", "critical"]);
export const FeedbackStatus = z.enum(["new", "in_progress", "resolved", "closed"]);

export type FeedbackTypeValue = z.infer<typeof FeedbackType>;
export type FeedbackPriorityValue = z.infer<typeof FeedbackPriority>;
export type FeedbackStatusValue = z.infer<typeof FeedbackStatus>;

export const FEEDBACK_TYPE_LABELS: Record<FeedbackTypeValue, string> = {
  issue: "Issue",
  feature_request: "Feature Request",
  feedback: "Feedback",
};

export const FEEDBACK_STATUS_LABELS: Record<FeedbackStatusValue, string> = {
  new: "New",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

export const FEEDBACK_PRIORITY_LABELS: Record<FeedbackPriorityValue, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

const VOTE_FIELDS = new Set(["upvoteCount", "downvoteCount", "voteScore"]);

const optionalText = z.string().trim().min(1).max(200).optional();

/**
 * Designer-aligned Feedbacks fields for future UI and tests.
 * Platform / designer own storage; this documents the intended shape.
 */
export const Item = z.object({
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().min(10),
  type: FeedbackType.default("feature_request"),
  priority: FeedbackPriority,
  status: FeedbackStatus.default("new"),
  pointOfContactId: optionalText,
  pointOfContactName: optionalText,
  pointOfContactEmail: z.string().trim().email().max(320).optional(),
  upvoteCount: z.number().default(0),
  downvoteCount: z.number().default(0),
  voteScore: z.number().default(0),
});

export type ItemData = z.output<typeof Item>;

/** Drop empty form strings and client vote writes so defaults and optional POC can run. */
export function coerceItemInput(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (VOTE_FIELDS.has(key)) continue;
    if (value === "" || value === undefined || value === null) continue;
    if (typeof value === "string") out[key] = value;
    else out[key] = value;
  }
  return out;
}
