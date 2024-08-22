/// <reference types="vite/client" />

import { TimeLogCRDT } from "./core";
import { CheckList, Tag, Task } from "./core/model";

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
    tag: {
      createWithIdName: (id: string, name: string) => Tag;
      notifyChange: () => void;
    };
    task: {
      createWithIdNameCommentDoneOrderCreate_date_since_1970ParentTaskCheckList: (
        id: string,
        name: string,
        comment: string,
        done: boolean,
        order: number,
        create_date_since_1970: number,
        parentTask?: string,
        checkList?: string
      ) => Task;
      notifyChange: () => void;
    };
    crypto: {
      getRandomValues: (_: Uint32Array) => Uint32Array | undefined;
    };
  };
  let TL_CRDT_Client: typeof TimeLogCRDT;
}

export {};
