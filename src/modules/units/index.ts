import { Elysia, t } from "elysia";
import { db } from "../../db";
import { units } from "../../db/schema";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../../auth/middleware";

export const unitRoutes = new Elysia({ prefix: "/units" })
  .use(authMiddleware)
  .get("/", async () => {
    const data = await db.select().from(units);
    return { success: true, data };
  })
  .post(
    "/",
    async ({ body }) => {
      const [inserted] = await db.insert(units).values(body).returning();
      if (!inserted) {
        throw new Error("Gagal menambahkan unit");
      }
      return { success: true, data: inserted, message: "Unit berhasil ditambahkan" };
    },
    {
      body: t.Object({
        nomorUnit: t.String(),
        clusterId: t.String(),
        unitTypeId: t.String(),
        status: t.Optional(t.String()),
        lantai: t.Optional(t.Number()),
        luas: t.Optional(t.String()),
      }),
    }
  )
  .put("/:id", async ({ params: { id }, body }) => {
    await db.update(units).set(body).where(eq(units.id, id));
    return { success: true, message: "Unit berhasil diupdate" };
  }, {
    body: t.Partial(t.Object({
      status: t.String(),
      lantai: t.Number(),
      luas: t.String(),
    }))
  });
