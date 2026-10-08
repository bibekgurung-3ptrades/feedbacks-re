import "./globals.css";
import { ModuleDocument } from "@captify-io/sdk/next";
import { Confirmer, Toaster } from "@captify-io/ui";
import type { ReactNode } from "react";

/** Every page, inside Titan's shell, drawn with the design system, with toasts and confirmations. */
export default function Layout({ children }: { readonly children: ReactNode }) {
  return (
    <ModuleDocument moduleId="feedbacks">
      {children}
      <Toaster />
      <Confirmer />
    </ModuleDocument>
  );
}
