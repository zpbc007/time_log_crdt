import { applyUpdateV2, Doc, encodeStateAsUpdateV2 } from "yjs";
import { createService } from "./service";
import { CommonResultCode, DocSyncEventName, Result } from "./common/type";
import { rootBus } from "./common/eventbus";

const rootDoc: Doc = new Doc();
let service: ReturnType<typeof createService> | undefined;
let loaded: boolean = false;

enum LoadResultCode {
  loaded = 100,
}

function load(persistedState?: Uint8Array): Result<void> {
  if (loaded) {
    return {
      code: LoadResultCode.loaded,
    };
  }

  if (persistedState !== undefined && persistedState !== null) {
    // 复制一份，swift 可以将传入的 state 释放
    const copyState = persistedState.slice();
    TL_CRDT_Native.logger.log(
      `load persistedState length: ${copyState.length}`
    );
    applyUpdateV2(rootDoc, copyState);
  }

  service = createService(rootDoc);
  loaded = true;

  return {
    code: CommonResultCode.success,
  };
}

function save(): Result<{ size: number; sync: (_: Uint8Array) => void }> {
  const encodedState = encodeStateAsUpdateV2(rootDoc);

  TL_CRDT_Native.logger.log(`will save data len: ${encodedState.length}`);

  return {
    code: CommonResultCode.success,
    data: {
      size: encodedState.length,
      sync: (nativeArray: Uint8Array) => {
        for (let i = 0; i < encodedState.length; i++) {
          nativeArray[i] = encodedState[i];
        }
      },
    },
  };
}

enum SyncCode {
  noState = 100,
}
function sync(persistedState?: Uint8Array): Result<void> {
  if (!persistedState) {
    return {
      code: SyncCode.noState,
    };
  } else {
    applyUpdateV2(rootDoc, persistedState);
    rootBus.emit(DocSyncEventName);

    return {
      code: CommonResultCode.success,
    };
  }
}

export const TimeLogCRDT = new Proxy(
  { load, save, sync },
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
