import { crossSiteRefusal } from "@captify-io/sdk";
import { withCaller } from "@captify-io/sdk/next";
import { addNote, listNotes } from "../../../lib/notes";

const HOME = "/feedbacks";

export const GET = withCaller(async (caller) => Response.json({ items: await listNotes(caller) }));

/** Adds a note from the page's form, or from JSON, sent from the estate's own pages. */
export const POST = withCaller(async (caller, request) => {
  const refusal = crossSiteRefusal(request);
  if (refusal) return refusal;
  const isForm = request.headers.get("content-type")?.includes("form") ?? false;
  const input = isForm ? Object.fromEntries(await request.formData()) : await request.json();
  const note = await addNote(caller, input);
  if (isForm) return new Response(null, { status: 303, headers: { location: HOME } });
  return Response.json(note, { status: 201 });
});
