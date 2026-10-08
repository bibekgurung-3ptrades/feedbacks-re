import { readableHandler } from "@captify-io/sdk";
import { withCaller } from "@captify-io/sdk/next";
import { readableNotes } from "../../../lib/notes";

/** Which notes a person may read, asked by Platform's comments and by search. */
export const POST = withCaller(readableHandler((caller, { ids }) => readableNotes(caller, ids)));
