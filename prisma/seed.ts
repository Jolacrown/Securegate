import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/hash";

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const adminEmail = "admin@securegate.local";
  const adminPassword = "Admin@123!";

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await hashPassword(adminPassword);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: "ADMIN",
      },
    });
    console.log(`✅ Admin user created: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   ⚠️  Change this password immediately in production!`);
  } else {
    console.log(`ℹ️  Admin user already exists: ${adminEmail}`);
  }

  // Create a regular test user
  const userEmail = "user@securegate.local";
  const userPassword = "User@123!";

  const existingUser = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!existingUser) {
    const passwordHash = await hashPassword(userPassword);
    await prisma.user.create({
      data: {
        email: userEmail,
        passwordHash,
        role: "USER",
      },
    });
    console.log(`✅ Test user created: ${userEmail}`);
    console.log(`   Password: ${userPassword}`);
  } else {
    console.log(`ℹ️  Test user already exists: ${userEmail}`);
  }

  console.log("\n🌱 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
