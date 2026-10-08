import type { DeclaredCoreRole } from "@captify-io/platform";
import { type TestEstate, testEstate } from "@captify-io/platform/testing";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { GET, POST } from "../app/api/notes/route";
import { POST as readable } from "../app/api/readable/route";
import dev from "../captify.dev.json";
import manifest from "../captify.module.json";
import { NOTE_TYPE } from "../lib/notes";

// The app's tables go in a test database on this Postgres, whose role must be a superuser.
const url = process.env.CAPTIFY_TEST_POSTGRES_URL;

// A write from the estate's own pages, as Titan forwards it.
const SAME_ORIGIN = { origin: "http://estate.test", "x-forwarded-host": "estate.test" };

const TABLE = "notes";
const API = "/feedbacks/api";

describe.skipIf(!url)("notes", () => {
  let estate: TestEstate;

  // The real kernel, in-process: every call the handlers make is decided as in production.
  // Each tenant keeps the core roles captify dev declares for its tenants.
  beforeAll(async () => {
    estate = await testEstate({
      manifest,
      coreRoles: dev.coreRoles as DeclaredCoreRole[],
      people: [
        { sub: "ada", tenant: "acme", roles: ["admin"] },
        { sub: "grace", tenant: "acme", roles: ["user"] },
        { sub: "linus", tenant: "globex", roles: ["admin"] },
      ],
      database: { adminUrl: url ?? "", name: "feedbacks_test" },
    });
    // The test database is kept between runs, so each run starts its tenants empty.
    for (const sub of ["ada", "linus"])
      await (await estate.caller(sub)).db().run(`DELETE FROM ${TABLE}`);
  });
  afterAll(() => estate?.close());

  const add = async (sub: string, title: string, headers: Record<string, string> = SAME_ORIGIN) =>
    POST(
      await estate.request(sub, `${API}/notes`, {
        method: "POST",
        headers: { "content-type": "application/json", ...headers },
        body: JSON.stringify({ title }),
      }),
      {},
    );

  const list = async (sub: string) => {
    const answer = await GET(await estate.request(sub, `${API}/notes`), {});
    return ((await answer.json()) as { items: { title: string }[] }).items.map((n) => n.title);
  };

  test("an admin's note is read by a user in the same tenant only", async () => {
    expect((await add("ada", "First")).status).toBe(201);
    expect(await list("grace")).toContain("First");
    expect(await list("linus")).not.toContain("First");
  });

  test("a user cannot add a note", async () => {
    expect((await add("grace", "Nope")).status).toBe(403);
  });

  test("a note needs a title", async () => {
    expect((await add("ada", " ")).status).toBe(400);
  });

  test("a note sent from another site is refused", async () => {
    const forged = { origin: "http://evil.test", "x-forwarded-host": "estate.test" };
    expect((await add("ada", "Forged", forged)).status).toBe(403);
    expect(await list("ada")).not.toContain("Forged");
  });

  test("Platform learns who may read a note from the readable endpoint", async () => {
    const { id } = (await (await add("ada", "Asked about")).json()) as { id: string };
    const ask = async (sub: string) => {
      const request = await estate.request(sub, `${API}/readable`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: NOTE_TYPE, ids: [id, "not-a-note"] }),
      });
      return ((await (await readable(request, {})).json()) as { ids: string[] }).ids;
    };
    expect(await ask("grace")).toEqual([id]);
    expect(await ask("linus")).toEqual([]);
  });
});
