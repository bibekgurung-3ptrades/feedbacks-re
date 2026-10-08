import { caller } from "@captify-io/sdk/next";
import { Button, Input, Label, Notice, PageLayout, Stack } from "@captify-io/ui";
import { NOTE_RESOURCE } from "../../lib/notes";

const NOTES = { label: "Notes", href: "/feedbacks" };

// The sidebar lists this page only for people who may write notes, and the page checks again.
export default async function NewNote() {
  const me = await caller();
  const canWrite = await me.can(`${NOTE_RESOURCE}:create`);
  return (
    <PageLayout
      layout="stack"
      title="New note"
      breadcrumbs={[NOTES, { label: "New note" }]}
      regions={{
        content: canWrite ? (
          <form method="post" action="/feedbacks/api/notes">
            <Stack gap="sm">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required maxLength={200} placeholder="A new note" />
              <div>
                <Button type="submit">Add</Button>
              </div>
            </Stack>
          </form>
        ) : (
          <Notice>You can read notes, but not add them.</Notice>
        ),
      }}
    />
  );
}
