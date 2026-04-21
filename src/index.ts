import { Elysia, t } from "elysia";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

const app = new Elysia()
  .get("/ping", () => ({ status: "pong" }))
  .group("/users", (app) =>
    app
      .get("/", async () => {
        return await db.select().from(users);
      })
      .post("/", async ({ body }) => {
        const [result] = await db.insert(users).values(body).$returningId();
        return { id: result.id, ...body };
      }, {
        body: t.Object({
          name: t.String(),
          email: t.String({ format: "email" }),
        })
      })
      .get("/:id", async ({ params: { id } }) => {
        const [user] = await db.select().from(users).where(eq(users.id, Number(id)));
        if (!user) return { error: "User not found" };
        return user;
      })
      .patch("/:id", async ({ params: { id }, body }) => {
        await db.update(users).set(body).where(eq(users.id, Number(id)));
        return { status: "updated" };
      }, {
        body: t.Partial(t.Object({
          name: t.String(),
          email: t.String({ format: "email" }),
        }))
      })
      .delete("/:id", async ({ params: { id } }) => {
        await db.delete(users).where(eq(users.id, Number(id)));
        return { status: "deleted" };
      })
  )
  .listen(3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
