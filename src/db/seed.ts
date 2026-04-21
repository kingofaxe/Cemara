import { db } from "./index";
import { users } from "./schema";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Seeding database...");

  const adminPassword = await bcrypt.hash("admin123", 10);

  await db.insert(users).values({
    username: "admin",
    name: "System Admin",
    email: "admin@cemara.com",
    password: adminPassword,
    role: "admin",
    isActive: true,
  }).onConflictDoNothing();

  console.log("✅ Seeding completed!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
