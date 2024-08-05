import { TimeLogCRDT } from "@/core";

// @ts-expect-error 添加全局属性供 swift 调用
window.timeLogCRDT = new TimeLogCRDT();
