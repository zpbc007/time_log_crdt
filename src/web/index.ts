import { TimeLogCRDT } from "@/core";
import { TLEvent } from "@/core/model";
import { DaySetting } from "@/core/model/DaySettings";

const NativeShim: typeof TL_CRDT_Native = {
  info: {
    disableChangeNotify: false,
  },
  logger: {
    log: (msg: string) => {
      console.log(msg);
    },
  },
  checkList: {
    createWithIdNameColorHexCreate_date_since_1970(
      id,
      name,
      colorHex,
      create_date_since_1970
    ) {
      return {
        id,
        create_date_since_1970,
        name,
        colorHex,
      };
    },
    notifyChange: () => {
      console.log("checklist change!");
    },
  },
  tag: {
    createWithIdName: (id, name) => {
      return {
        id,
        name,
      };
    },
    notifyChange: () => {
      console.log("tag change");
    },
  },
  event: {
    createWithIdNameCommentArchivedCreate_date_since_1970CheckList: (
      id: string,
      name: string,
      comment: string,
      archived: boolean,
      create_date_since_1970: number,
      checkList: string | null
    ) => {
      return {
        id,
        name,
        comment,
        archived,
        create_date_since_1970,
        checkList,
      } as TLEvent;
    },
    notifyChange: () => {
      console.log("task change");
    },
  },
  taskLog: {
    createWithIdTaskCommentStart_date_since_1970End_date_since_1970: (
      id: string,
      task: string,
      comment: string,
      start_date_since_1970: number,
      end_date_since_1970: number | null
    ) => {
      return {
        id,
        task,
        comment,
        start_date_since_1970,
        end_date_since_1970: end_date_since_1970 || Date.now(),
      };
    },
    notifyChange: () => {
      console.log("taskLog change");
    },
    notifyRecordingChange: () => {
      console.log("recording taskLog change");
    },
  },
  crypto: {
    getRandomValues(arr: Uint32Array) {
      return window.crypto.getRandomValues(arr);
    },
  },
  daySetting: {
    createWithDate_since_1970TargetReview: function (
      date_since_1970: number,
      target: string,
      review: string
    ): DaySetting {
      return {
        date_since_1970,
        target,
        review,
      };
    },
    notifyChange: function (): void {
      console.log("daySetting change");
    },
  },
};

// @ts-expect-error web 中模拟
window.TL_CRDT_Native = NativeShim;
// @ts-expect-error web 中模拟
window.TL_CRDT_Client = TimeLogCRDT;
