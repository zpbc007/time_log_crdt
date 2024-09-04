import { TimeLogCRDT } from "@/core";

const NativeShim: typeof TL_CRDT_Native = {
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
    ) => {
      return {
        id,
        name,
        comment,
        done,
        order,
        create_date_since_1970,
        parentTask,
        checkList,
      };
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
      end_date_since_1970?: number
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
};

// @ts-expect-error web 中模拟
window.TL_CRDT_Native = NativeShim;
// @ts-expect-error web 中模拟
window.TL_CRDT_Client = TimeLogCRDT;
