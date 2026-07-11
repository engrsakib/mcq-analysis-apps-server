import { Express, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import {
  openApiSpec,
  SWAGGER_BASE_PATH,
  SWAGGER_JSON_PATH,
} from "./openapi.spec";

export const setupSwagger = (app: Express): void => {
  app.get(SWAGGER_JSON_PATH, (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/json");
    res.send(openApiSpec);
  });

  app.use(
    SWAGGER_BASE_PATH,
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, {
      customSiteTitle: "MCQ Analyzer API Docs",
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        url: SWAGGER_JSON_PATH,
      },
    })
  );
};

export default setupSwagger;
