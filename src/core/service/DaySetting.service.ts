import { Doc } from "yjs";
import { CommonResultCode, Result } from "../common/type";
import {
  DaySetting,
  fromNativeDaySetting,
  toNativeDaySetting,
} from "../model/DaySettings";
import { DaySettingTableKey } from "./constants";

export type DaySettingService = {
  queryByDate: (date_since_1970: number) => Result<DaySetting | undefined>;
  upsert: (daySetting: DaySetting) => Result<void>;
  upsertTarget: (date_since_1970: number, target: string) => Result<void>;
};

export function createDaySettingService(
  doc: Doc,
  disableChangeNotify: boolean = false
): DaySettingService {
  const daySettingMap = doc.getMap<DaySetting>(DaySettingTableKey);

  if (!disableChangeNotify) {
    daySettingMap.observe(() => {
      TL_CRDT_Native.daySetting.notifyChange();
    });
  }

  const upsert: DaySettingService["upsert"] = daySetting => {
    daySetting = fromNativeDaySetting(daySetting);
    daySettingMap.set(daySetting.date_since_1970.toString(), daySetting);

    return {
      code: CommonResultCode.success,
    };
  };

  const upsertTarget: DaySettingService["upsertTarget"] = (
    date_since_1970,
    target
  ) => {
    const currentVal = daySettingMap.get(date_since_1970.toString());

    daySettingMap.set(date_since_1970.toString(), {
      ...(currentVal || {
        date_since_1970,
        target: "",
        review: "",
      }),
      date_since_1970,
      target,
    });

    return {
      code: CommonResultCode.success,
    };
  };

  const queryByDate: DaySettingService["queryByDate"] = date_since_1970 => {
    const result = daySettingMap.get(date_since_1970.toString());

    return {
      code: CommonResultCode.success,
      data: result ? toNativeDaySetting(result) : undefined,
    };
  };

  return {
    queryByDate,
    upsert,
    upsertTarget,
  };
}