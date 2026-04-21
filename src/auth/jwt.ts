import { jwt } from "@elysiajs/jwt";

export const authJwt = jwt({
  name: "jwt",
  secret: process.env.JWT_SECRET!,
  exp: "7d",
});
