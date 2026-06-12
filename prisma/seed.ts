import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding users...");

  const adminPassword = await bcrypt.hash("Admin@1234", 12);
  const employeePassword = await bcrypt.hash("Employee@1234", 12);

  // Admin
  await prisma.user.upsert({
    where: {
      email: "admin-dubai@arnifi.com",
    },
    update: {},
    create: {
      name: "Admin Dubai",
      email: "admin-dubai@arnifi.com",
      password: adminPassword,
      role: Role.ADMIN,
      mustResetPassword: false,
      isActive: true,
    },
  });

  // Employee 1
  await prisma.user.upsert({
    where: {
      email: "employee1@arnifi.com",
    },
    update: {},
    create: {
      name: "Employee One",
      email: "employee1@arnifi.com",
      password: employeePassword,
      role: Role.EMPLOYEE,
      mustResetPassword: false,
      isActive: true,
    },
  });

  // Employee 2
  await prisma.user.upsert({
    where: {
      email: "employee2@arnifi.com",
    },
    update: {},
    create: {
      name: "Employee Two",
      email: "employee2@arnifi.com",
      password: employeePassword,
      role: Role.EMPLOYEE,
      mustResetPassword: false,
      isActive: true,
    },
  });

  console.log("✅ Users seeded");

  console.log("\n🎉 Seed complete!");
  console.log("--------------------------------");
  console.log("Admin:");
  console.log("admin-dubai@arnifi.com");
  console.log("Password: Admin@1234");
  console.log("--------------------------------");
  console.log("Employee 1:");
  console.log("employee1@arnifi.com");
  console.log("Password: Employee@1234");
  console.log("--------------------------------");
  console.log("Employee 2:");
  console.log("employee2@arnifi.com");
  console.log("Password: Employee@1234");
  console.log("--------------------------------");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });