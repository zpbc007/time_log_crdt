export class EventBus {
  listeners: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [event: string]: Array<any>;
  } = {};

  // 注册事件监听器
  on(event: string, listener: () => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  // 触发事件
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emit(event: string, data?: any) {
    const listeners = this.listeners[event];

    if (listeners) {
      listeners.forEach(listener => {
        listener(data);
      });
    }
  }

  // 注销事件监听器
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  off(event: string, listener: any) {
    const listeners = this.listeners[event];
    if (listeners && listeners.length > 0) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
}

export const rootBus = new EventBus();
