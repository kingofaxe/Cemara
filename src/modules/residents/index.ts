import { Elysia, t } from "elysia";
import { db } from "../../db";
import { residents, users, residentDocuments, vehicles } from "../../db/schema";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../../auth/middleware";
import bcrypt from "bcryptjs";

export const residentRoutes = new Elysia({ prefix: "/residents" })
  .use(authMiddleware)
  .post(
    "/",
    async ({ body }) => {
      // 1. Create user account for resident (Username = Unit Number)
      const hashedPassword = await bcrypt.hash("password123", 10); // Default password
      const [user] = await db.insert(users).values({
        username: body.nomorUnit,
        name: body.namaLengkap,
        password: hashedPassword,
        role: body.status === "pemilik" ? "penghuni_pemilik" : "penghuni_sewa",
      }).returning();
      if (!user) {
        throw new Error("Gagal membuat akun user untuk penghuni");
      }

      // 2. Create resident entry
      const [resident] = await db.insert(residents).values({
        userId: user.id,
        unitId: body.unitId,
        namaLengkap: body.namaLengkap,
        nik: body.nik,
        noKk: body.noKk,
        status: body.status,
        tanggalMasuk: body.tanggalMasuk,
      }).returning();

      return { success: true, data: resident, message: "Penghuni berhasil didaftarkan" };
    },
    {
      body: t.Object({
        nomorUnit: t.String(),
        unitId: t.String(),
        namaLengkap: t.String(),
        nik: t.String(),
        noKk: t.Optional(t.String()),
        status: t.String(), // pemilik/sewa/kos
        tanggalMasuk: t.String(),
      }),
    }
  )
  .post("/:id/vehicles", async ({ params: { id }, body }) => {
    const [vehicle] = await db.insert(vehicles).values({
      residentId: id,
      ...body
    }).returning();
    return { success: true, data: vehicle, message: "Kendaraan berhasil didaftarkan" };
  }, {
    body: t.Object({
      tipe: t.String(),
      platNomor: t.String(),
      warna: t.Optional(t.String()),
      merek: t.Optional(t.String()),
    })
  });
