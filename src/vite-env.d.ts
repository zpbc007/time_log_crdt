/// <reference types="vite/client" />

import { TimeLogCRDT } from "./core";
import { Category, Tag, TLEvent, TaskLog } from "./core/model";
import { DaySetting } from "./core/model/DaySettings";

declare global {
  const TL_CRDT_Native: {
    info: {
      disableChangeNotify: boolean;
    };
    logger: {
      log: (message: string) => void;
    };
    category: {
      createWithIdNameColorHexCreate_date_since_1970: (
        id: string,
        name: string,
        colorHex: string,
        create_date_since_1970: number
      ) => Category;
      notifyChange: () => void;
    };
    tag: {
      createWithIdName: (id: string, name: string) => Tag;
      notifyChange: () => void;
    };
    event: {
      createWithIdNameCommentArchivedCreate_date_since_1970CheckList: (
        id: string,
        name: string,
        comment: string,
        archived: boolean,
        create_date_since_1970: number,
        checkList: string
      ) => TLEvent;
      notifyChange: () => void;
    };
    taskLog: {
      createWithIdTaskCommentStart_date_since_1970End_date_since_1970: (
        id: string,
        task: string,
        comment: string,
        start_date_since_1970: number,
        end_date_since_1970: number
      ) => TaskLog;
      notifyChange: () => void;
      notifyRecordingChange: () => void;
    };
    daySetting: {
      createWithDate_since_1970TargetReview: (
        date_since_1970: number,
        target: string,
        review: string
      ) => DaySetting;
      notifyChange: () => void;
    };
    crypto: {
      getRandomValues: (_: Uint32Array) => Uint32Array | undefined;
    };
  };
  let TL_CRDT_Client: typeof TimeLogCRDT;
}

export {};
