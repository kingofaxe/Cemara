import { Elysia, t } from "elysia";
import { db } from "../../db";
import { rtRw, clusters, unitTypes } from "../../db/schema";
import { eq } from "drizzle-orm";

export const masterRoutes = new Elysia({ prefix: "/master" })
  // RT/RW
  .get("/rt-rw", async () => await db.select().from(rtRw))
  .post("/rt-rw", async ({ body }) => {
    return await db.insert(rtRw).values(body).returning();
  }, {
    body: t.Object({
      namaRt: t.String(),
      namaRw: t.String(),
      wilayah: t.Optional(t.String()),
    })
  })
  // Clusters
  .get("/cluster", async () => await db.select().from(clusters))
  .post("/cluster", async ({ body }) => {
    return await db.insert(clusters).values(body).returning();
  }, {
    body: t.Object({
      nama: t.String(),
      kode: t.Optional(t.String()),
      rtRwId: t.String(),
    })
  })
  // Unit Types
  .get("/unit-type", async () => await db.select().from(unitTypes))
  .post("/unit-type", async ({ body }) => {
    return await db.insert(unitTypes).values(body).returning();
  }, {
    body: t.Object({
      nama: t.String(),
      kode: t.Optional(t.String()),
    })
  });
