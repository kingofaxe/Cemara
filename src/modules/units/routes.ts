import { Elysia, t } from "elysia";
import { db } from "../../db";
import { units, residents, users } from "../../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const unitRoutes = new Elysia({ prefix: "/units" })
  .get("/", async () => await db.select().from(units))
  .post("/", async ({ body }) => {
    return await db.insert(units).values(body).returning();
  }, {
    body: t.Object({
      nomorUnit: t.String(),
      clusterId: t.String(),
      unitTypeId: t.String(),
      lantai: t.Optional(t.Number()),
      luas: t.Optional(t.String()),
    })
  });

export const residentRoutes = new Elysia({ prefix: "/residents" })
  .post("/", async ({ body, set }) => {
    return await db.transaction(async (tx) => {
      // 1. Ambil info unit untuk username
      const unit = await tx.query.units.findFirst({
        where: eq(units.id, body.unitId),
      });

      if (!unit) {
        set.status = 404;
        return { success: false, message: "Unit tidak ditemukan" };
      }

      // 2. Buat User Account otomatis
      const defaultPassword = await bcrypt.hash("warga123", 10);
      const [newUser] = await tx.insert(users).values({
        username: unit.nomorUnit, // Username = No Rumah
        name: body.namaLengkap,
        password: defaultPassword,
        role: body.status === 'kos' ? 'penghuni_kos' : 'penghuni_pemilik', // Simple logic
        isActive: true,
      }).returning();

      // 3. Simpan data resident
      const [newResident] = await tx.insert(residents).values({
        userId: newUser.id,
        unitId: body.unitId,
        namaLengkap: body.namaLengkap,
        nik: body.nik,
        noKk: body.noKk,
        status: body.status,
        tanggalMasuk: body.tanggalMasuk,
      }).returning();

      // 4. Update status unit
      await tx.update(units)
        .set({ status: 'dihuni' })
        .where(eq(units.id, body.unitId));

      return {
        success: true,
        data: { resident: newResident, user: { username: newUser.username } },
        message: "Penghuni berhasil didaftarkan dan akun otomatis dibuat",
      };
    });
  }, {
    body: t.Object({
      unitId: t.String(),
      namaLengkap: t.String(),
      nik: t.Optional(t.String()),
      noKk: t.Optional(t.String()),
      status: t.String(), // pemilik/sewa/kos
      tanggalMasuk: t.String(),
    })
  });
