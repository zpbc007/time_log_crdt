import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  createTaskService,
  TaskService,
} from "../../../src/core/service/Task.service";
import { Doc } from "yjs";
import { Task, toNativeTask } from "../../../src/core/model";
import { CommonResultCode } from "../../../src/core/common/type";

describe("core.service.Task.service", () => {
  let taskService: TaskService;
  let notifyChange;
  let rootDoc: Doc;

  beforeEach(() => {
    notifyChange = vi.fn();

    vi.stubGlobal("TL_CRDT_Native", {
      task: {
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
    taskService = createTaskService(rootDoc, false);
  });

  it("upsert & query should work", () => {
    const tagIds = new Array(5).fill(1).map((_, index) => `tag-id-${index}`);
    const tasks: Task[] = new Array(10).fill(1).map((_, index) => {
      return {
        id: `task-id-${index}`,
        name: `task-name-${index}`,
        comment: `task-comment-${index}`,
        done: index % 2 === 0,
        order: index,
        create_date_since_1970: Date.now(),
        checkList: index % 2 === 0 ? "checkList-1" : undefined,
      };
    });
    tasks.forEach(task => {
      taskService.upsert(task, [...tagIds]);
    });

    const queryAllWithoutDoneResult = taskService.queryAll(false);
    const queryAllWithDone = taskService.queryAll(true);
    expect(queryAllWithoutDoneResult.code).toEqual(CommonResultCode.success);
    expect(queryAllWithoutDoneResult.data.map(item => item.id)).toEqual(
      tasks
        .map((item, index) => (index % 2 == 0 ? undefined : item.id))
        .filter(item => item)
    );
    expect(queryAllWithDone.code).toEqual(CommonResultCode.success);
    expect(queryAllWithDone.data.map(item => item.id)).toEqual(
      tasks.map(item => item.id)
    );

    const queryByIdResult = taskService.queryById(tasks[0].id);
    expect(queryByIdResult.code).toEqual(CommonResultCode.success);
    // @ts-expect-error should has data
    expect(queryByIdResult.data.id).toEqual(tasks[0].id);

    const queryByIdsResult = taskService.queryByIds(tasks.map(item => item.id));
    expect(queryByIdsResult.code).toEqual(CommonResultCode.success);
    expect(queryByIdsResult.data.map(item => item.id)).toEqual(
      tasks.map(item => item.id)
    );

    const queryByCheckListResult = taskService.queryByCheckList(
      "checkList-1",
      true
    );
    expect(queryByCheckListResult.code).toEqual(CommonResultCode.success);
    expect(queryByCheckListResult.data.map(item => item.id)).toEqual(
      tasks.filter((_, index) => index % 2 === 0).map(item => item.id)
    );

    const queryByTagResult = taskService.queryByTag(tagIds[0], true);
    expect(queryByTagResult.code).toEqual(CommonResultCode.success);
    expect(queryByTagResult.data.map(item => item.id)).toEqual(
      tasks.map(item => item.id)
    );

    const queryTagsResult = taskService.queryTags(tasks[0].id);
    expect(queryTagsResult.code).toEqual(CommonResultCode.success);
    expect(queryTagsResult.data).toEqual(tagIds);

    const queryTagRelationResult = taskService.queryTagRelation(
      tasks.map(item => item.id)
    );
    expect(queryTagRelationResult.code).toEqual(CommonResultCode.success);
    expect(Object.keys(queryTagRelationResult.data).sort()).toEqual(
      tasks.map(item => item.id)
    );
    expect(Object.values(queryTagRelationResult.data)).toEqual(
      tasks.map(() => tagIds)
    );
  });

  it("update should work", () => {
    const tagIds = new Array(5).fill(1).map((_, index) => `tag-id-${index}`);
    const tasks: Task[] = new Array(10).fill(1).map((_, index) => {
      return {
        id: `task-id-${index}`,
        name: `task-name-${index}`,
        comment: `task-comment-${index}`,
        done: index % 2 === 0,
        order: index,
        create_date_since_1970: Date.now(),
        checkList: index % 2 === 0 ? "checkList-1" : undefined,
      };
    });
    tasks.forEach(task => {
      taskService.upsert(task, [...tagIds]);
    });

    const updatedTasks = tasks.map(item => ({
      ...item,
      name: `${item.name}-new`,
    }));
    taskService.update(updatedTasks);

    expect(
      taskService.queryByIds(updatedTasks.map(item => item.id)).data
    ).toEqual(updatedTasks.map(toNativeTask));
  });

  it("delete should work", () => {
    const tagIds = new Array(5).fill(1).map((_, index) => `tag-id-${index}`);
    const tasks: Task[] = new Array(10).fill(1).map((_, index) => {
      return {
        id: `task-id-${index}`,
        name: `task-name-${index}`,
        comment: `task-comment-${index}`,
        done: index % 2 === 0,
        order: index,
        create_date_since_1970: Date.now(),
        checkList: index % 2 === 0 ? "checkList-1" : undefined,
      };
    });
    tasks.forEach(task => {
      taskService.upsert(task, [...tagIds]);
    });

    taskService.delete(tasks[0].id);
    expect(
      taskService
        .queryByIds(tasks.map(item => item.id))
        .data.map(item => item.id)
    ).toEqual(tasks.map(item => item.id).filter((_, index) => index !== 0));
  });
});
