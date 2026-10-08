import { type Caller, filterSql, PlatformError, parseInput } from "@captify-io/sdk";
import { z } from "zod";

/** The type of a note, as captify.module.json describes it. */
export const NOTE_TYPE = "feedbacks.note";

/** The resource captify-core's policies decide notes by, as captify.module.json declares it. */
export const NOTE_RESOURCE = "feedbacks";

/** A note as people write it. */
export const NoteInput = z.object({
  title: z.string().trim().min(1).max(200),
  done: z.boolean().default(false),
});

/** A note as the app keeps it in its own table. */
export type Note = {
  id: string;
  title: string;
  done: boolean;
  createdBy: string;
  createdAt: Date;
};

/** The app's table of notes in each tenant's schema, made by migrations/0001_notes.sql. */
const TABLE = "notes";

const COLUMNS = `id, title, done, created_by AS "createdBy", created_at AS "createdAt"`;

/** The column keeping each attribute the resource declares, which policies' conditions read. */
const ATTRIBUTES = { createdBy: "created_by" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * A condition for the notes the person may take `action` on, as Platform answers it from the
 * tenant's policies, its placeholders following `offset` of the query's own.
 */
async function permitted(caller: Caller, action: string, offset = 0) {
  const { allowed, filter } = await caller.platform.itemFilter(NOTE_RESOURCE, action);
  if (!allowed) throw new PlatformError(403, "forbidden", `You may not ${action} notes`);
  return filterSql(filter, ATTRIBUTES, offset);
}

/** The newest notes the person may list. */
export async function listNotes(caller: Caller): Promise<Note[]> {
  const where = await permitted(caller, "list");
  return caller
    .db()
    .many<Note>(
      `SELECT ${COLUMNS} FROM ${TABLE} WHERE ${where.sql} ORDER BY created_at DESC LIMIT 200`,
      where.parameters,
    );
}

/** One note the person may read, or undefined. */
export async function findNote(caller: Caller, id: string): Promise<Note | undefined> {
  if (!UUID.test(id)) return undefined;
  const where = await permitted(caller, "read", 1);
  return caller
    .db()
    .one<Note>(`SELECT ${COLUMNS} FROM ${TABLE} WHERE id = $1 AND ${where.sql}`, [
      id,
      ...where.parameters,
    ]);
}

/** Adds a note as the person's, then audits it and tells subscribers of it. */
export async function addNote(caller: Caller, input: unknown): Promise<Note> {
  const { title, done } = parseInput(NoteInput, input);
  const createdBy = caller.identity.sub;
  const [allowed] = await caller.platform.checkItems(NOTE_RESOURCE, "create", [{ createdBy }]);
  if (!allowed) throw new PlatformError(403, "forbidden", "You may not add notes");
  const note = await caller
    .db()
    .one<Note>(
      `INSERT INTO ${TABLE} (title, done, created_by) VALUES ($1, $2, $3) RETURNING ${COLUMNS}`,
      [title, done, createdBy],
    );
  if (!note) throw new Error("The note was not added");
  await caller.audit("create", { type: NOTE_TYPE, id: note.id }, { title });
  await caller.publish({
    type: NOTE_TYPE,
    id: note.id,
    change: "created",
    data: { title, done, createdBy },
  });
  return note;
}

/** Which of `ids` the person may read, for the readable endpoint. */
export async function readableNotes(caller: Caller, ids: readonly string[]): Promise<string[]> {
  const { allowed, filter } = await caller.platform.itemFilter(NOTE_RESOURCE, "read");
  const asked = ids.filter((id) => UUID.test(id));
  if (!allowed || !asked.length) return [];
  const where = filterSql(filter, ATTRIBUTES, 1);
  const rows = await caller
    .db()
    .many<{ id: string }>(`SELECT id FROM ${TABLE} WHERE id = ANY($1::uuid[]) AND ${where.sql}`, [
      asked,
      ...where.parameters,
    ]);
  return rows.map((row) => row.id);
}
