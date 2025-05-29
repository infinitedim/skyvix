import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 12);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@skyvix.com" },
    update: {},
    create: {
      email: "admin@skyvix.com",
      password: hashedPassword,
      firstName: "Admin",
      lastName: "User",
      isActive: true,
    },
  });

  console.log({ adminUser });

  const testPassword = await bcrypt.hash("test123", 12);

  const testUser = await prisma.user.upsert({
    where: { email: "test@skyvix.com" },
    update: {},
    create: {
      email: "test@skyvix.com",
      password: testPassword,
      firstName: "Test",
      lastName: "User",
      isActive: true,
    },
  });

  console.log({ testUser });

  const sampleOrder = await prisma.order.create({
    data: {
      userId: testUser.id,
      amount: 100000,
      currency: "IDR",
      description: "Sample order",
      status: "PENDING",
    },
  });

  console.log({ sampleOrder });
}

main()
  .then(async () => {
    return await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });