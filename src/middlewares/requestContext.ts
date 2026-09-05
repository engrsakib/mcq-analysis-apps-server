import { AsyncLocalStorage } from "async_hooks";
import { NextFunction, Request, Response } from "express";
import { getClientIp } from "@/utils/getClientIp";

export type RequestContext = {
  ipAddress: string;
  userAgent?: string;
};

const requestContextStorage = new AsyncLocalStorage<RequestContext>();

export function getRequestContext(): RequestContext | undefined {
  return requestContextStorage.getStore();
}

export function requestContextMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const context: RequestContext = {
    ipAddress: getClientIp(req),
    userAgent: req.headers["user-agent"],
  };

  requestContextStorage.run(context, () => {
    next();
  });
}
