import "../core/shim/crypto";
import { TimeLogCRDT } from "@/core";

// 添加全局属性供 swift 调用
TL_CRDT_Client = TimeLogCRDT;
