import { Elysia, t } from "elysia";
import { db } from "../../db";
import { rtRw, clusters, unitTypes } from "../../db/schema";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../../auth/middleware";

export const masterRoutes = new Elysia({ prefix: "/master" })
  .use(authMiddleware)
  .guard({ role: "admin" })
  .group("/rt-rw", (app) =>
    app
      .get("/", async () => {
        const data = await db.select().from(rtRw);
        return { success: true, data };
      })
      .post(
        "/",
        async ({ body }) => {
          const [inserted] = await db.insert(rtRw).values(body).returning();
          if (!inserted) throw new Error("Gagal menambahkan RT/RW");
          return { success: true, data: inserted, message: "RT/RW berhasil ditambahkan" };
        },
        {
          body: t.Object({
            namaRt: t.String(),
            namaRw: t.String(),
            wilayah: t.Optional(t.String()),
          }),
        }
      )
  )
  .group("/cluster", (app) =>
    app
      .get("/", async () => {
        const data = await db.select().from(clusters);
        return { success: true, data };
      })
      .post(
        "/",
        async ({ body }) => {
          const [inserted] = await db.insert(clusters).values(body).returning();
          if (!inserted) throw new Error("Gagal menambahkan cluster");
          return { success: true, data: inserted, message: "Cluster berhasil ditambahkan" };
        },
        {
          body: t.Object({
            nama: t.String(),
            kode: t.String(),
            rtRwId: t.String(),
          }),
        }
      )
  )
  .group("/unit-type", (app) =>
    app
      .get("/", async () => {
        const data = await db.select().from(unitTypes);
        return { success: true, data };
      })
      .post(
        "/",
        async ({ body }) => {
          const [inserted] = await db.insert(unitTypes).values(body).returning();
          if (!inserted) throw new Error("Gagal menambahkan tipe unit");
          return { success: true, data: inserted, message: "Tipe unit berhasil ditambahkan" };
        },
        {
          body: t.Object({
            nama: t.String(),
            kode: t.String(),
          }),
        }
      )
  );
