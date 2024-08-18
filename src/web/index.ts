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
