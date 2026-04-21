import { Elysia, t } from "elysia";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const authRoutes = new Elysia({ prefix: "/auth" })
  .post(
    "/login",
    async ({ body, jwt, set }) => {
      const { username, password } = body;

      const user = await db.query.users.findFirst({
        where: eq(users.username, username),
      });

      if (!user || !user.isActive) {
        set.status = 401;
        return { success: false, message: "Username atau password salah" };
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        set.status = 401;
        return { success: false, message: "Username atau password salah" };
      }

      const token = await jwt.sign({
        id: user.id,
        role: user.role,
        username: user.username,
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
    const authHeader = headers["authorization"];
    if (!authHeader?.startsWith("Bearer ")) {
      set.status = 401;
      return { success: false, message: "Unauthorized" };
    }

    const token = authHeader.split(" ")[1];
    const payload = await jwt.verify(token);

    if (!payload) {
      set.status = 401;
      return { success: false, message: "Unauthorized" };
    }

    return {
      success: true,
      data: payload,
      message: "Data user berhasil diambil",
    };
  });
