import { Response } from "express";

class SSEManager {
  private clients = new Map<string, Set<Response>>();

  subscribe(adminId: string, res: Response): void {
    if (!this.clients.has(adminId)) {
      this.clients.set(adminId, new Set());
    }
    this.clients.get(adminId)!.add(res);
  }

  unsubscribe(adminId: string, res: Response): void {
    const set = this.clients.get(adminId);
    if (!set) return;

    set.delete(res);
    if (set.size === 0) {
      this.clients.delete(adminId);
    }
  }

  broadcast(adminId: string, event: { type: string; data: unknown }): void {
    const set = this.clients.get(adminId);
    if (!set?.size) return;

    const payload = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;

    const clients = Array.from(set);
    for (const res of clients) {
      try {
        res.write(payload);
      } catch {
        set.delete(res);
      }
    }
  }
}

export const sseManager = new SSEManager();
