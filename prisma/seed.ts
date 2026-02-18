import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash("admin123456", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@phantom.dev" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@phantom.dev",
      hashedPassword: adminPassword,
      role: "ADMIN",
      subscription: {
        create: {
          plan: "ENTERPRISE",
        },
      },
    },
  });

  // Create demo user
  const userPassword = await bcrypt.hash("user123456", 12);
  const user = await prisma.user.upsert({
    where: { email: "user@phantom.dev" },
    update: {},
    create: {
      name: "Demo User",
      email: "user@phantom.dev",
      hashedPassword: userPassword,
      role: "USER",
      subscription: {
        create: {
          plan: "FREE",
        },
      },
    },
  });

  console.log("Seeded database with:");
  console.log(`  Admin: ${admin.email} (password: admin123456)`);
  console.log(`  User: ${user.email} (password: user123456)`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
