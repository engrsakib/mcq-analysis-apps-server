// src/events/JobQueue.ts
import { AppEvent } from "./EventTypes";

export class JobQueue {
  private queue: AppEvent[] = [];
  private processing = false;
  private handler: ((event: AppEvent) => Promise<void>) | null = null;

  setHandler(handler: (event: AppEvent) => Promise<void>) {
    this.handler = handler;
  }

  enqueue(event: AppEvent) {
    this.queue.push(event);
    void this.process();
  }

  private async process() {
    if (this.processing || !this.handler) return;
    this.processing = true;

    while (this.queue.length) {
      const job = this.queue.shift()!;
      try {
        await this.handler(job);
      } catch (error) {
        // Safety: notification/DB errors in background jobs must not crash the server.
        console.error("[JobQueue] Event handler failed:", error);
      }
    }

    this.processing = false;
  }
}

export const jobQueue = new JobQueue();
