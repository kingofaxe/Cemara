import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { cors } from "@elysiajs/cors";
import { authRoutes } from "./auth/routes";
import { masterRoutes } from "./modules/master/routes";
import { unitRoutes, residentRoutes } from "./modules/units/routes";

const app = new Elysia()
  .use(cors())
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
    })
  )
  .get("/api/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))
  .group("/api", (app) => 
    app
      .use(authRoutes)
      .use(masterRoutes)
      .use(unitRoutes)
      .use(residentRoutes)
  )
  .listen(process.env.PORT || 3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

export type App = typeof app;
