import { PageLayout } from "@captify-io/ui";

export default function Home() {
  return (
    <PageLayout
      layout="stack"
      title="Feedbacks"
      description="Feedbacks registration is in place. Record list and edit UI will follow."
      regions={{
        content: (
          <p className="text-muted-foreground text-sm">
            This module stands for core Feedbacks and reads Schema Designer type designer.feedbacks.
            Product pages come in a later change.
          </p>
        ),
      }}
    />
  );
}
