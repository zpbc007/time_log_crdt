import "../core/shim/crypto";
import { TimeLogCRDT } from "@/core";

TL_CRDT_Native.logger.log("create timeLogCRDT");
// 添加全局属性供 swift 调用
TL_CRDT_Client = TimeLogCRDT;
