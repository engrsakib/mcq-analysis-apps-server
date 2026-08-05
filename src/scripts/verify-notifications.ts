import assert from "node:assert/strict";
import { Response } from "express";
import { sseManager } from "@/modules/notification/notification.sse";

function runTests() {
  const chunks: string[] = [];
  const mockRes = {
    write: (chunk: string) => {
      chunks.push(chunk);
      return true;
    },
  } as unknown as Response;

  sseManager.subscribe("admin-test", mockRes);
  sseManager.broadcast("admin-test", {
    type: "notification",
    data: {
      _id: "n1",
      title: "Question Created",
      description: "Rahim Ahmed created question #12345678 in Physics",
      isRead: false,
    },
  });

  assert.equal(chunks.length, 1);
  assert.match(chunks[0], /event: notification/);
  assert.match(chunks[0], /Rahim Ahmed created question/);

  console.log("SSE notification verification passed");
}

runTests();
