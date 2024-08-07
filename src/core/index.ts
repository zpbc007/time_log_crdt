import { applyUpdateV2, Doc } from "yjs";
import { createDB } from "./db";

const rootDoc: Doc = new Doc();
let service: ReturnType<typeof createDB> | undefined;
let loaded: boolean = false;

const load = (persistedState?: Uint8Array) => {
  if (loaded) {
    return;
  }

  if (persistedState !== undefined) {
    applyUpdateV2(rootDoc, persistedState);
  }

  service = createDB(rootDoc);
  loaded = true;
};

export const TimeLogCRDT = new Proxy(
  { load },
  {
    get: function (target, property) {
      if (property === "service") {
        return service;
      }

      // @ts-expect-error 这里不做处理
      return property in target ? target[property] : undefined;
    },
  }
);
