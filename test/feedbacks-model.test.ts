import { expect, test } from "vitest";
import { coerceItemInput, FEEDBACKS_TYPE, Item } from "../lib/feedbacks";

const base = {
  title: "Add dark mode",
  description: "Please add a dark theme option.",
  priority: "medium",
};

test("FEEDBACKS_TYPE is designer.feedbacks", () => {
  expect(FEEDBACKS_TYPE).toBe("designer.feedbacks");
});

test("Item accepts a designer-shaped payload with defaults", () => {
  const parsed = Item.parse(coerceItemInput(base));
  expect(parsed).toMatchObject({
    title: "Add dark mode",
    description: "Please add a dark theme option.",
    type: "feature_request",
    priority: "medium",
    status: "new",
    upvoteCount: 0,
    downvoteCount: 0,
    voteScore: 0,
  });
});

test("Item accepts status new and rejects open", () => {
  expect(Item.safeParse(coerceItemInput({ ...base, status: "new" })).success).toBe(true);
  expect(Item.safeParse(coerceItemInput({ ...base, status: "open" })).success).toBe(false);
});

test("Item rejects a title shorter than 3 characters", () => {
  expect(Item.safeParse(coerceItemInput({ ...base, title: "ab" })).success).toBe(false);
});

test("Item rejects a description shorter than 10 characters", () => {
  expect(Item.safeParse(coerceItemInput({ ...base, description: "too short" })).success).toBe(
    false,
  );
});

test("Item rejects an invalid POC email when present", () => {
  expect(
    Item.safeParse(coerceItemInput({ ...base, pointOfContactEmail: "not-an-email" })).success,
  ).toBe(false);
});

test("coerceItemInput drops client vote tallies", () => {
  const coerced = coerceItemInput({ ...base, upvoteCount: 99, downvoteCount: 2, voteScore: 97 });
  expect(coerced).not.toHaveProperty("upvoteCount");
  expect(Item.parse(coerced).upvoteCount).toBe(0);
});
