// src/events/EventBus.ts
import { AppEvent } from "./EventTypes";

type EventHandler = (event: AppEvent) => Promise<void> | void;

class EventBus {
  private handlers: EventHandler[] = [];

  subscribe(handler: EventHandler) {
    this.handlers.push(handler);
  }

  async publish(event: AppEvent) {
    for (const handler of this.handlers) {
      await handler(event);
    }
  }
}

export const eventBus = new EventBus();
