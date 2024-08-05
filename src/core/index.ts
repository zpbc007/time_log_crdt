import { applyUpdateV2, Doc } from "yjs";
import { createDB } from "./db";

export class TimeLogCRDT {
  rootDoc: Doc = new Doc();
  service?: ReturnType<typeof createDB>;
  loaded = false;

  load(persistedState?: Uint8Array) {
    if (this.loaded) {
      return;
    }

    if (persistedState !== undefined) {
      applyUpdateV2(this.rootDoc, persistedState);
    }

    this.service = createDB(this.rootDoc);
    this.loaded = true;
  }
}
