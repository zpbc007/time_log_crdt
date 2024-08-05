import { applyUpdateV2, Doc } from "yjs";
import { createDB } from "./db";

export class TimeLogCRDT {
  rootDoc: Doc = new Doc();
  service?: ReturnType<typeof createDB>;

  load(persistedState?: Uint8Array) {
    if (persistedState !== undefined) {
      applyUpdateV2(this.rootDoc, persistedState);
    }

    this.service = createDB(this.rootDoc);
  }
}
