import { applyUpdateV2, Doc, encodeStateAsUpdateV2 } from "yjs";
import { createService } from "./service";
import { CommonResultCode, Result } from "./common/type";

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
      `load persistedState: length: ${copyState.length}, data: ${copyState}`
    );
    applyUpdateV2(rootDoc, copyState);
  }

  service = createService(rootDoc);
  loaded = true;

  return {
    code: CommonResultCode.success,
  };
}

function save(): Result<Uint8Array> {
  const encodedState = encodeStateAsUpdateV2(rootDoc);

  return {
    code: CommonResultCode.success,
    data: encodedState,
  };
}

function sync(persistedState: Uint8Array): Result<void> {
  applyUpdateV2(rootDoc, persistedState);

  return {
    code: CommonResultCode.success,
  };
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
