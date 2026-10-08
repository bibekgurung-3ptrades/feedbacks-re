import { caller } from "@captify-io/sdk/next";
import { PageLayout, Text } from "@captify-io/ui";
import { notFound } from "next/navigation";
import { findNote } from "../../../lib/notes";

const NOTES = { label: "Notes", href: "/feedbacks" };

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const note = await findNote(await caller(), id);
  if (!note) notFound();
  return (
    <PageLayout
      layout="stack"
      title={note.title}
      breadcrumbs={[NOTES, { label: note.title }]}
      regions={{ content: <Text>{note.done ? "Done" : "Not done yet"}</Text> }}
    />
  );
}
