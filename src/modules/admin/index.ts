import { Elysia, t } from "elysia";
import { db } from "../../db";
import { users, menuPermissions } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { authMiddleware } from "../../auth/middleware";

export const adminRoutes = new Elysia({ prefix: "/admin" })
  .use(authMiddleware)
  .guard({ role: "admin" })
  .group("/users", (app) =>
    app
      .get("/", async () => {
        const data = await db.select({
          id: users.id,
          username: users.username,
          name: users.name,
          email: users.email,
          role: users.role,
          isActive: users.isActive,
        }).from(users);
        return { success: true, data };
      })
      .post(
        "/",
        async ({ body }) => {
          const hashedPassword = await bcrypt.hash(body.password, 10);
          const [inserted] = await db.insert(users).values({
            ...body,
            password: hashedPassword,
          }).returning();
          if (!inserted) throw new Error("Gagal membuat user");
          return { success: true, data: inserted, message: "User berhasil dibuat" };
        },
        {
          body: t.Object({
            username: t.String(),
            name: t.String(),
            email: t.Optional(t.String()),
            password: t.String(),
            role: t.String(),
          }),
        }
      )
      .put("/:id/role", async ({ params: { id }, body }) => {
        await db.update(users).set({ role: body.role }).where(eq(users.id, id));
        return { success: true, message: "Role berhasil diubah" };
      }, {
        body: t.Object({ role: t.String() })
      })
      .put("/:id/status", async ({ params: { id }, body }) => {
        await db.update(users).set({ isActive: body.isActive }).where(eq(users.id, id));
        return { success: true, message: "Status akun berhasil diubah" };
      }, {
        body: t.Object({ isActive: t.Boolean() })
      })
  )
  .group("/menus", (app) =>
    app
      .get("/", async () => {
        const data = await db.select().from(menuPermissions);
        return { success: true, data };
      })
      .put("/:menuKey/role/:role", async ({ params: { menuKey, role }, body }) => {
        const [existing] = await db.select().from(menuPermissions).where(
          and(eq(menuPermissions.menuKey, menuKey), eq(menuPermissions.role, role))
        ).limit(1);

        if (existing) {
          await db.update(menuPermissions).set({ isVisible: body.isVisible, accessLevel: body.accessLevel })
            .where(eq(menuPermissions.id, existing.id));
        } else {
          await db.insert(menuPermissions).values({
            menuKey,
            role,
            isVisible: body.isVisible,
            accessLevel: body.accessLevel,
          });
        }
        return { success: true, message: "Permission berhasil diupdate" };
      }, {
        body: t.Object({
          isVisible: t.Boolean(),
          accessLevel: t.Optional(t.String()),
        })
      })
  );
