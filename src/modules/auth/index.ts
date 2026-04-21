import { Elysia, t } from "elysia";
import { db } from "../../db";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { authJwt } from "../../auth/jwt";

export const authRoutes = new Elysia({ prefix: "/auth" })
  .use(authJwt)
  .post(
    "/login",
    async ({ body, jwt, set }) => {
      const { username, password } = body;

      const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);

      if (!user || !(await bcrypt.compare(password, user.password))) {
        set.status = 401;
        return {
          success: false,
          data: null,
          message: "Username atau password salah",
          errors: null,
        };
      }

      if (!user.isActive) {
        set.status = 403;
        return {
          success: false,
          data: null,
          message: "Akun Anda tidak aktif",
          errors: null,
        };
      }

      const token = await jwt.sign({
        id: user.id,
        username: user.username,
        role: user.role,
      });

      return {
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
          },
        },
        message: "Login berhasil",
        errors: null,
      };
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
      }),
    }
  )
  .get("/me", async ({ jwt, headers, set }) => {
    const auth = headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
      set.status = 401;
      return { success: false, message: "Unauthorized" };
    }

    const token = auth.slice(7);
    const payload = await jwt.verify(token);

    if (!payload) {
      set.status = 401;
      return { success: false, message: "Invalid token" };
    }

    const [user] = await db.select().from(users).where(eq(users.id, payload.id as string)).limit(1);

    if (!user) {
      set.status = 404;
      return { success: false, message: "User not found" };
    }

    return {
      success: true,
      data: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
      message: "Berhasil mengambil data user",
      errors: null,
    };
  });
