import { Elysia } from "elysia";
import { authJwt } from "./jwt";
import { db } from "../db";
import { menuPermissions } from "../db/schema";
import { and, eq } from "drizzle-orm";

export const authMiddleware = new Elysia()
  .use(authJwt)
  .derive(async ({ jwt, headers, set }) => {
    const auth = headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
      return { user: null };
    }

    const token = auth.slice(7);
    const payload = await jwt.verify(token);

    if (!payload) {
      return { user: null };
    }

    return { user: payload };
  })
  .macro(({ onBeforeHandle }) => ({
    role(role: string | string[]) {
      onBeforeHandle(({ user, set }: any) => {
        if (!user) {
          set.status = 401;
          return { success: false, message: "Unauthorized" };
        }

        const roles = Array.isArray(role) ? role : [role];
        if (!roles.includes(user.role as string)) {
          set.status = 403;
          return { success: false, message: "Forbidden: Access denied" };
        }
      });
    },
    permission(menuKey: string) {
      onBeforeHandle(async ({ user, set }: any) => {
        if (!user) {
          set.status = 401;
          return { success: false, message: "Unauthorized" };
        }

        const [permission] = await db
          .select()
          .from(menuPermissions)
          .where(
            and(
              eq(menuPermissions.role, user.role as string),
              eq(menuPermissions.menuKey, menuKey)
            )
          )
          .limit(1);

        if (!permission || !permission.isVisible) {
          set.status = 403;
          return { success: false, message: "Forbidden: No permission for this menu" };
        }
      });
    },
  }));
