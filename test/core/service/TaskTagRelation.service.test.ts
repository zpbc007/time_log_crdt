import { describe, expect, it, beforeEach } from "vitest";
import {
  createTaskTagRelationService,
  TaskTagRelationService,
} from "../../../src/core/service/TaskTagRelation.service";
import { Doc } from "yjs";

describe("core.service.TaskTagRelation.service", () => {
  let taskTagRelationService: TaskTagRelationService;
  let rootDoc: Doc;

  beforeEach(() => {
    rootDoc = new Doc();
    taskTagRelationService = createTaskTagRelationService(rootDoc);
  });

  it("upsert should update task2tagsMap & tag2tasksMap", () => {
    const taskId1 = "taskId-1";
    // 首次设置
    taskTagRelationService.upsert(taskId1, ["tag-1", "tag-2"]);

    expect(taskTagRelationService.queryTasksByTag("tag-1")).toEqual([taskId1]);
    expect(taskTagRelationService.queryTasksByTag("tag-2")).toEqual([taskId1]);
    expect(taskTagRelationService.queryTagsByTask(taskId1)).toEqual([
      "tag-1",
      "tag-2",
    ]);

    // 二次设置，添加 tag-3\tag-4，删除 tag-2
    taskTagRelationService.upsert(taskId1, ["tag-1", "tag-3", "tag-4"]);

    expect(taskTagRelationService.queryTasksByTag("tag-1")).toEqual([taskId1]);
    expect(taskTagRelationService.queryTasksByTag("tag-2")).toEqual([]);
    expect(taskTagRelationService.queryTasksByTag("tag-3")).toEqual([taskId1]);
    expect(taskTagRelationService.queryTagsByTask(taskId1)).toEqual([
      "tag-1",
      "tag-3",
      "tag-4",
    ]);
  });

  it("deleteTask should update task2tagsMap & tag2tasksMap", () => {
    taskTagRelationService.upsert("taskId-1", [
      "tag-1",
      "tag-2",
      "tag-3",
      "tag-4",
    ]);
    taskTagRelationService.upsert("taskId-2", ["tag-1", "tag-2", "tag-3"]);

    expect(taskTagRelationService.queryTagsByTask("taskId-1")).toEqual([
      "tag-1",
      "tag-2",
      "tag-3",
      "tag-4",
    ]);
    expect(taskTagRelationService.queryTagsByTask("taskId-2")).toEqual([
      "tag-1",
      "tag-2",
      "tag-3",
    ]);
    expect(taskTagRelationService.queryTasksByTag("tag-1")).toEqual([
      "taskId-1",
      "taskId-2",
    ]);
    expect(taskTagRelationService.queryTasksByTag("tag-4")).toEqual([
      "taskId-1",
    ]);

    taskTagRelationService.deleteTask("taskId-1");
    expect(taskTagRelationService.queryTagsByTask("taskId-1")).toEqual([]);
    expect(taskTagRelationService.queryTagsByTask("taskId-2")).toEqual([
      "tag-1",
      "tag-2",
      "tag-3",
    ]);
    expect(taskTagRelationService.queryTasksByTag("tag-1")).toEqual([
      "taskId-2",
    ]);
  });

  it("deleteTags should update task2tagsMap & tag2tasksMap", () => {
    taskTagRelationService.upsert("taskId-1", [
      "tag-1",
      "tag-2",
      "tag-3",
      "tag-4",
    ]);
    taskTagRelationService.upsert("taskId-2", [
      "tag-1",
      "tag-2",
      "tag-3",
      "tag-4",
    ]);

    taskTagRelationService.deleteTags(["tag-1", "tag-3"]);
    expect(taskTagRelationService.queryTagsByTask("taskId-1")).toEqual([
      "tag-2",
      "tag-4",
    ]);
    expect(taskTagRelationService.queryTasksByTag("tag-1")).toEqual([]);
    expect(taskTagRelationService.queryTasksByTag("tag-2")).toEqual([
      "taskId-1",
      "taskId-2",
    ]);
  });
});
