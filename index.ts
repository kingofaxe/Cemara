import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { authRoutes } from "./src/modules/auth";
import { masterRoutes } from "./src/modules/master";
import { adminRoutes } from "./src/modules/admin";
import { unitRoutes } from "./src/modules/units";
import { residentRoutes } from "./src/modules/residents";

const app = new Elysia()
  .use(cors())
  .get("/api/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))
  .group("/api", (app) => 
    app
      .use(authRoutes)
      .use(masterRoutes)
      .use(adminRoutes)
      .use(unitRoutes)
      .use(residentRoutes)
  )
  .listen(process.env.PORT || 3000);

console.log(`🚀 Server is running at ${app.server?.hostname}:${app.server?.port}`);