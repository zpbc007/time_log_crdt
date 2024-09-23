import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  binarySearch,
  difference,
  isSameDay,
} from "../../../src/core/common/helper";

describe("core.common.helper.difference", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("difference [1, 2, 3, 4, 5] and [5, 2, 10], should return [1, 3, 4]", () => {
    expect(difference([1, 2, 3, 4, 5], [5, 2, 10])).toEqual([1, 3, 4]);
  });

  it("difference [1, 2, 3] and [1, 2, 3], should return []", () => {
    expect(difference([1, 2, 3], [1, 2, 3])).toEqual([]);
  });
});

describe("core.common.helper.isSameDay", () => {
  it("isSameDay 2023-04-05 and 2023-04-06, should return false", () => {
    expect(isSameDay(new Date("2023-04-05"), new Date("2023-04-06"))).toEqual(
      false
    );
  });

  it("isSameDay 2023-04-05 and 2023-04-05, should return true", () => {
    const date1 = new Date("2023-04-05");
    const date2 = new Date("2023-04-05");
    date2.setHours(23);
    expect(isSameDay(date1, date2)).toEqual(true);
  });
});

describe("core.common.helper.binarySearch", () => {
  it("binarySearch [1, 3, 5, 7, 9, 11] for 9, result should be 4", () => {
    const searchResult = binarySearch([1, 3, 5, 7, 9, 11], item => item - 9);

    expect(searchResult.result).toEqual(4);
    expect(searchResult.left).toEqual(4);
  });

  it("binarySearch [1, 3, 5, 7, 9, 11] for 8, result should be -1, left should be 4", () => {
    const searchResult = binarySearch([1, 3, 5, 7, 9, 11], item => item - 8);

    expect(searchResult.left).toEqual(4);
    expect(searchResult.result).toEqual(-1);
  });

  it("binarySearch [1, 3, 5, 7, 9, 11] for 3, ignore 7, result should be 1", () => {
    const searchResult = binarySearch(
      [1, 3, 5, 7, 9, 11],
      item => item - 3,
      item => item == 7
    );

    expect(searchResult.result).toEqual(1);
    expect(searchResult.left).toEqual(1);
  });

  it("binarySearch [1, 3, 5, 7, 9, 11] for 2, ignore 7, result should be 1", () => {
    const searchResult = binarySearch(
      [1, 3, 5, 7, 9, 11],
      item => item - 2,
      item => item == 7
    );

    expect(searchResult.left).toEqual(1);
    expect(searchResult.result).toEqual(-1);
  });

  it("binarySearch [1, 3, 5, 5, 5, 5, 7, 9, 11] for 8, ignore 5, left should be 7", () => {
    const searchResult = binarySearch(
      [1, 3, 5, 5, 5, 5, 7, 9, 11],
      item => item - 8,
      item => item == 5
    );

    expect(searchResult.result).toEqual(-1);
    expect(searchResult.left).toEqual(7);
  });
});
