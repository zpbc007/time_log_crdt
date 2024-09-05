import { describe, expect, it, beforeEach, vi } from "vitest";
import { EventBus } from "../../../src/core/common/eventbus";

describe("core.common.eventbus", () => {
  let bus: EventBus;
  beforeEach(() => {
    bus = new EventBus();
  });

  it("emit should only call current event handler", () => {
    const eventName = "test";
    const handleEvent = vi.fn();

    bus.on(eventName, handleEvent);
    bus.emit(eventName);
    bus.emit(eventName);
    bus.emit("xxx");

    expect(handleEvent).toBeCalledTimes(2);
  });

  it("off should work", () => {
    const eventName = "test";
    const handleEvent = vi.fn();

    bus.on(eventName, handleEvent);
    bus.emit(eventName);
    bus.off(eventName, handleEvent);
    bus.emit(eventName);

    expect(handleEvent).toBeCalledTimes(1);
  });
});
