import { caller } from "@captify-io/sdk/next";
import { ListTable, PageLayout } from "@captify-io/ui";
import { listNotes } from "../lib/notes";

export default async function Home() {
  const me = await caller();
  const listed = await listNotes(me);
  return (
    <PageLayout
      layout="stack"
      title="Feedbacks"
      description={`Signed in as ${me.identity.name}.`}
      regions={{
        content: (
          <ListTable
            label="Notes"
            emptyLabel="No notes yet."
            rows={listed.map((note) => ({
              id: note.id,
              label: note.title,
              href: `/feedbacks/notes/${note.id}`,
              description: note.done ? "Done" : undefined,
            }))}
          />
        ),
      }}
    />
  );
}
