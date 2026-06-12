import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    if (users.length === 0) {
      console.log("❌ NO USERS FOUND — run: npm run db:seed");
    } else {
      console.log(`✅ Found ${users.length} user(s):`);
      users.forEach((u) =>
        console.log(`   ${u.role.padEnd(6)} | ${u.email} | active=${u.isActive}`)
      );
    }
  } catch (e) {
    console.error("❌ Database error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
