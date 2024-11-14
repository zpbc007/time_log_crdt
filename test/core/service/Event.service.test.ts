import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  createEventService,
  EventService,
} from "../../../src/core/service/Event.service";
import { Doc } from "yjs";
import { TLEvent, toNativeEvent } from "../../../src/core/model";
import { CommonResultCode } from "../../../src/core/common/type";

describe("core.service.Event.service", () => {
  let eventService: EventService;
  let notifyChange;
  let rootDoc: Doc;

  beforeEach(() => {
    notifyChange = vi.fn();

    vi.stubGlobal("TL_CRDT_Native", {
      event: {
        notifyChange,
        createWithIdNameCommentDoneOrderCreate_date_since_1970ParentTaskCheckList:
          (
            id: string,
            name: string,
            comment: string,
            done: boolean,
            order: number,
            create_date_since_1970: number,
            parentTask: string,
            checkList: string
          ) => ({
            id,
            name,
            comment,
            done,
            order,
            create_date_since_1970,
            parentTask,
            checkList,
          }),
      },
    });

    rootDoc = new Doc();
    eventService = createEventService(rootDoc, false);
  });

  it("upsert & query should work", () => {
    const tagIds = new Array(5).fill(1).map((_, index) => `tag-id-${index}`);
    const events: TLEvent[] = new Array(10).fill(1).map((_, index) => {
      return {
        id: `event-id-${index}`,
        name: `event-name-${index}`,
        comment: `event-comment-${index}`,
        done: index % 2 === 0,
        order: index,
        create_date_since_1970: Date.now(),
        checkList: index % 2 === 0 ? "checkList-1" : undefined,
      };
    });
    events.forEach(event => {
      eventService.upsert(event, [...tagIds]);
    });

    const queryAllWithoutDoneResult = eventService.queryAll(false);
    const queryAllWithDone = eventService.queryAll(true);
    expect(queryAllWithoutDoneResult.code).toEqual(CommonResultCode.success);
    expect(queryAllWithoutDoneResult.data.map(item => item.id)).toEqual(
      events
        .map((item, index) => (index % 2 == 0 ? undefined : item.id))
        .filter(item => item)
    );
    expect(queryAllWithDone.code).toEqual(CommonResultCode.success);
    expect(queryAllWithDone.data.map(item => item.id)).toEqual(
      events.map(item => item.id)
    );

    const queryByIdResult = eventService.queryById(events[0].id);
    expect(queryByIdResult.code).toEqual(CommonResultCode.success);
    // @ts-expect-error should has data
    expect(queryByIdResult.data.id).toEqual(events[0].id);

    const queryByIdsResult = eventService.queryByIds(
      events.map(item => item.id)
    );
    expect(queryByIdsResult.code).toEqual(CommonResultCode.success);
    expect(queryByIdsResult.data.map(item => item.id)).toEqual(
      events.map(item => item.id)
    );

    const queryByCheckListResult = eventService.queryByCheckList(
      "checkList-1",
      true
    );
    expect(queryByCheckListResult.code).toEqual(CommonResultCode.success);
    expect(queryByCheckListResult.data.map(item => item.id)).toEqual(
      events.filter((_, index) => index % 2 === 0).map(item => item.id)
    );

    const queryByTagResult = eventService.queryByTag(tagIds[0], true);
    expect(queryByTagResult.code).toEqual(CommonResultCode.success);
    expect(queryByTagResult.data.map(item => item.id)).toEqual(
      events.map(item => item.id)
    );

    const queryTagsResult = eventService.queryTags(events[0].id);
    expect(queryTagsResult.code).toEqual(CommonResultCode.success);
    expect(queryTagsResult.data).toEqual(tagIds);

    const queryTagRelationResult = eventService.queryTagRelation(
      events.map(item => item.id)
    );
    expect(queryTagRelationResult.code).toEqual(CommonResultCode.success);
    expect(Object.keys(queryTagRelationResult.data).sort()).toEqual(
      events.map(item => item.id)
    );
    expect(Object.values(queryTagRelationResult.data)).toEqual(
      events.map(() => tagIds)
    );
  });

  it("update should work", () => {
    const tagIds = new Array(5).fill(1).map((_, index) => `tag-id-${index}`);
    const events: TLEvent[] = new Array(10).fill(1).map((_, index) => {
      return {
        id: `event-id-${index}`,
        name: `event-name-${index}`,
        comment: `event-comment-${index}`,
        done: index % 2 === 0,
        order: index,
        create_date_since_1970: Date.now(),
        checkList: index % 2 === 0 ? "checkList-1" : undefined,
      };
    });
    events.forEach(event => {
      eventService.upsert(event, [...tagIds]);
    });

    const updatedEvents = events.map(item => ({
      ...item,
      name: `${item.name}-new`,
    }));
    eventService.update(updatedEvents);

    expect(
      eventService.queryByIds(updatedEvents.map(item => item.id)).data
    ).toEqual(updatedEvents.map(toNativeEvent));
  });

  it("delete should work", () => {
    const tagIds = new Array(5).fill(1).map((_, index) => `tag-id-${index}`);
    const events: TLEvent[] = new Array(10).fill(1).map((_, index) => {
      return {
        id: `event-id-${index}`,
        name: `event-name-${index}`,
        comment: `event-comment-${index}`,
        done: index % 2 === 0,
        order: index,
        create_date_since_1970: Date.now(),
        checkList: index % 2 === 0 ? "checkList-1" : undefined,
      };
    });
    events.forEach(event => {
      eventService.upsert(event, [...tagIds]);
    });

    eventService.delete(events[0].id);
    expect(
      eventService
        .queryByIds(events.map(item => item.id))
        .data.map(item => item.id)
    ).toEqual(events.map(item => item.id).filter((_, index) => index !== 0));
  });
});
