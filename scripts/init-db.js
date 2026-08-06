const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding SQLite database...');

  // Ensure default SystemSetting for allowPublicRegistration
  await prisma.systemSetting.upsert({
    where: { key: 'allowPublicRegistration' },
    update: {},
    create: {
      key: 'allowPublicRegistration',
      value: 'true'
    }
  });

  // Ensure Super Admin user exists
  const superAdmin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' }
  });

  if (!superAdmin) {
    await prisma.user.create({
      data: {
        username: 'superadmin',
        password: 'admin123',
        name: 'Super Administrator',
        role: 'SUPER_ADMIN',
        isActive: true
      }
    });
    console.log('Created default Super Admin: superadmin / admin123');
  } else {
    console.log('Super Admin already exists.');
  }

  console.log('Database initialization complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
