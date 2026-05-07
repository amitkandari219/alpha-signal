#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function setPassword(email: string, password: string) {
  try {
    console.log(`🔐 Setting password for: ${email}`);

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update user
    const user = await prisma.user.update({
      where: { email },
      data: { passwordHash },
    });

    console.log(`✅ Password set successfully!`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`🎖️  Tier: ${user.tier}`);
    console.log(``);
    console.log(`🎯 You can now login at http://localhost:3000`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);

  } catch (error: any) {
    console.error(`❌ Error:`, error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2] || 'amitkandari219@gmail.com';
const password = process.argv[3] || 'Admin123!';

console.log(`🚀 Setting Password for Alpha Signal Account\n`);
setPassword(email, password).then(() => process.exit(0));
