import { TaskLog } from "../../src/core/model";

export function createTaskLogByDateArray(
  dateArray: [string, string][],
  idPrefix: string = "id",
  reset2Zero: boolean = true
): TaskLog[] {
  return dateArray.map(([start, end], index) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (reset2Zero) {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
    }

    return {
      id: `${idPrefix}-taskLog-${index}`,
      task: "task-1",
      comment: "xxx",
      start_date_since_1970: startDate.getTime(),
      end_date_since_1970: endDate.getTime(),
    };
  });
}
