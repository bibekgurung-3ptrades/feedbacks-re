import { expect, test } from "vitest";
import manifest from "../captify.module.json";

test("stands for core feedbacks with featurePages list path", () => {
  expect(manifest.standsFor).toMatchObject({
    app: "feedbacks",
    featurePages: {
      menuItems: [],
      pageViewConfig: [
        {
          pageKey: "feedbacks",
          label: "Feedbacks",
          path: "/feedbacks",
          supportedViews: ["card", "table"],
        },
      ],
    },
  });
});

test("reads and writes designer.feedbacks, owns no feedback item type", () => {
  expect(manifest.readTypes).toEqual(["designer.feedbacks"]);
  expect(manifest.writeTypes).toEqual(["designer.feedbacks"]);
  expect(manifest).not.toHaveProperty("objectTypes");
  expect(manifest).not.toHaveProperty("types");
  expect(manifest).not.toHaveProperty("database");
  expect(manifest).not.toHaveProperty("readable");
});

test("declares coreSearch and assigned notification mapping", () => {
  expect(manifest.coreSearch).toEqual([
    {
      schema: "feedbacks",
      index: "captify-search-feedbacks",
      kind: "feedback",
      category: "Feedback",
      href: "/feedbacks/{id}",
    },
  ]);
  expect(manifest.notifications).toEqual([{ type: "assigned", core: ["feedback_assigned"] }]);
});

test("feedbacks resource exposes core actions including vote and comment", () => {
  const resource = manifest.resources.find((r) => r.name === "feedbacks");
  expect(resource?.actions).toEqual(
    expect.arrayContaining([
      "list",
      "read",
      "create",
      "update",
      "delete",
      "generate",
      "vote",
      "comment",
      "nav-view",
    ]),
  );
});

test("notes routes and new-note navigation are gone", () => {
  const paths = manifest.routes.map((r) => r.path);
  expect(paths).not.toContain("/feedbacks/api/notes");
  expect(paths).not.toContain("/feedbacks/notes/:id");
  expect(paths).toContain("/feedbacks");
  expect(manifest.navigation.some((n) => n.label === "New note")).toBe(false);
  expect(manifest.navigation.some((n) => n.path === "/feedbacks/new")).toBe(false);
});
