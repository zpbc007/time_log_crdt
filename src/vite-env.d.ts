/// <reference types="vite/client" />

import { TimeLogCRDT } from "./core";
import { CheckList } from "./core/model";

declare global {
  const TL_CRDT_Native: {
    logger: {
      log: (message: string) => void;
    };
    checkList: {
      createWithIdNameColorHexCreate_date_since_1970: (
        id: string,
        name: string,
        colorHex: string,
        create_date_since_1970: number
      ) => CheckList;
      notifyChange: () => void;
    };
    crypto: {
      getRandomValues: (_: Uint32Array) => Uint32Array | undefined;
    };
  };
  let TL_CRDT_Client: typeof TimeLogCRDT;
}

export {};
