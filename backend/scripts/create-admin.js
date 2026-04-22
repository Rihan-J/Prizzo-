/**
 * ─── Create Admin User Script ───
 *
 * Usage:
 *   node scripts/create-admin.js <name> <email> <password>
 *
 * Example:
 *   node scripts/create-admin.js "Super Admin" admin@prizzo.com MySecurePass123
 *
 * This script creates a user with role = ADMIN in the database.
 * It does NOT hardcode any credentials — all values come from CLI args.
 */

require("dotenv").config();
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const [, , name, email, password] = process.argv;

  if (!name || !email || !password) {
    console.error("\n❌ Usage: node scripts/create-admin.js <name> <email> <password>\n");
    console.error('   Example: node scripts/create-admin.js "Super Admin" admin@prizzo.com MySecurePass123\n');
    process.exit(1);
  }

  if (password.length < 6) {
    console.error("❌ Password must be at least 6 characters.");
    process.exit(1);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error("❌ Invalid email format.");
    process.exit(1);
  }

  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      if (existing.role === "ADMIN") {
        console.log(`\n⚠️  Admin user with email "${email}" already exists.\n`);
        process.exit(0);
      }

      // Upgrade existing user to ADMIN
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: "ADMIN" },
      });

      console.log(`\n✅ Existing user "${existing.name}" (${email}) has been upgraded to ADMIN role.\n`);
      process.exit(0);
    }

    // Hash password
    // commnet
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: "ADMIN",
      },
    });

    console.log(`\n✅ Admin user created successfully!`);
    console.log(`   Name:  ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role:  ${admin.role}`);
    console.log(`   ID:    ${admin.id}\n`);
  } catch (error) {
    console.error("❌ Failed to create admin:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
