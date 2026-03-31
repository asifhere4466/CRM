import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const org1 = await prisma.organization.upsert({
    where: { id: 'org-1' },
    update: {},
    create: {
      id: 'org-1',
      name: 'Acme Corporation',
    },
  });

  const org2 = await prisma.organization.upsert({
    where: { id: 'org-2' },
    update: {},
    create: {
      id: 'org-2',
      name: 'TechStart Inc',
    },
  });

  const org3 = await prisma.organization.upsert({
    where: { id: 'org-3' },
    update: {},
    create: {
      id: 'org-3',
      name: 'Global Solutions Ltd',
    },
  });

  console.log('✅ Organizations created');

  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.upsert({
    where: {
      email_organizationId: {
        email: 'admin@acme.com',
        organizationId: org1.id,
      },
    },
    update: {},
    create: {
      email: 'admin@acme.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
      organizationId: org1.id,
    },
  });

  const memberUser1 = await prisma.user.upsert({
    where: {
      email_organizationId: {
        email: 'member@acme.com',
        organizationId: org1.id,
      },
    },
    update: {},
    create: {
      email: 'member@acme.com',
      name: 'John Smith',
      password: hashedPassword,
      role: 'MEMBER',
      organizationId: org1.id,
    },
  });

  const memberUser2 = await prisma.user.upsert({
    where: {
      email_organizationId: {
        email: 'sarah@acme.com',
        organizationId: org1.id,
      },
    },
    update: {},
    create: {
      email: 'sarah@acme.com',
      name: 'Sarah Johnson',
      password: hashedPassword,
      role: 'MEMBER',
      organizationId: org1.id,
    },
  });

  const memberUser3 = await prisma.user.upsert({
    where: {
      email_organizationId: {
        email: 'mike@acme.com',
        organizationId: org1.id,
      },
    },
    update: {},
    create: {
      email: 'mike@acme.com',
      name: 'Mike Davis',
      password: hashedPassword,
      role: 'MEMBER',
      organizationId: org1.id,
    },
  });

  const org2Admin = await prisma.user.upsert({
    where: {
      email_organizationId: {
        email: 'admin@techstart.com',
        organizationId: org2.id,
      },
    },
    update: {},
    create: {
      email: 'admin@techstart.com',
      name: 'Tech Admin',
      password: hashedPassword,
      role: 'ADMIN',
      organizationId: org2.id,
    },
  });

  const org2Member = await prisma.user.upsert({
    where: {
      email_organizationId: {
        email: 'member@techstart.com',
        organizationId: org2.id,
      },
    },
    update: {},
    create: {
      email: 'member@techstart.com',
      name: 'Tech Member',
      password: hashedPassword,
      role: 'MEMBER',
      organizationId: org2.id,
    },
  });

  console.log('✅ Users created');

  const customers = [];
  const customerNames = [
    'Alice Williams',
    'Bob Brown',
    'Carol Davis',
    'David Miller',
    'Emma Wilson',
    'Frank Moore',
    'Grace Taylor',
    'Henry Anderson',
    'Ivy Thomas',
    'Jack Jackson',
    'Kate White',
    'Liam Harris',
    'Mia Martin',
    'Noah Thompson',
    'Olivia Garcia',
    'Peter Martinez',
    'Quinn Robinson',
    'Rachel Clark',
    'Sam Rodriguez',
    'Tina Lewis',
  ];

  for (let i = 0; i < customerNames.length; i++) {
    const name = customerNames[i];
    const email = name.toLowerCase().replace(' ', '.') + '@example.com';
    const assignedUser =
      i < 5
        ? memberUser1.id
        : i < 10
          ? memberUser2.id
          : i < 15
            ? memberUser3.id
            : null;

    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        phone: `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
        organizationId: org1.id,
        assignedToId: assignedUser,
      },
    });

    customers.push(customer);

    await prisma.activityLog.create({
      data: {
        entityType: 'customer',
        entityId: customer.id,
        action: 'CUSTOMER_CREATED',
        performedById: adminUser.id,
        organizationId: org1.id,
        metadata: {
          customerName: customer.name,
          customerEmail: customer.email,
        },
      },
    });

    if (assignedUser) {
      await prisma.activityLog.create({
        data: {
          entityType: 'customer',
          entityId: customer.id,
          action: 'CUSTOMER_ASSIGNED',
          performedById: adminUser.id,
          organizationId: org1.id,
          metadata: {
            assignedToId: assignedUser,
          },
        },
      });
    }
  }

  console.log('✅ Customers created');

  for (let i = 0; i < 10; i++) {
    const customer = customers[i];
    const note = await prisma.note.create({
      data: {
        content: `This is a sample note for ${customer.name}. Customer has shown interest in our premium services.`,
        customerId: customer.id,
        organizationId: org1.id,
        createdById: memberUser1.id,
      },
    });

    await prisma.activityLog.create({
      data: {
        entityType: 'note',
        entityId: note.id,
        action: 'NOTE_ADDED',
        performedById: memberUser1.id,
        organizationId: org1.id,
        metadata: {
          customerId: customer.id,
          customerName: customer.name,
        },
      },
    });
  }

  console.log('✅ Notes created');

  const org2Customers = [];
  for (let i = 0; i < 5; i++) {
    const customer = await prisma.customer.create({
      data: {
        name: `TechStart Customer ${i + 1}`,
        email: `customer${i + 1}@techstart-client.com`,
        phone: `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
        organizationId: org2.id,
        assignedToId: org2Member.id,
      },
    });
    org2Customers.push(customer);
  }

  console.log('✅ Org2 customers created');

  const deletedCustomer = await prisma.customer.create({
    data: {
      name: 'Deleted Customer',
      email: 'deleted@example.com',
      phone: '+11234567890',
      organizationId: org1.id,
      assignedToId: memberUser1.id,
      deletedAt: new Date(),
    },
  });

  await prisma.activityLog.create({
    data: {
      entityType: 'customer',
      entityId: deletedCustomer.id,
      action: 'CUSTOMER_DELETED',
      performedById: adminUser.id,
      organizationId: org1.id,
      metadata: {
        customerName: deletedCustomer.name,
      },
    },
  });

  console.log('✅ Soft-deleted customer created for testing');

  console.log('\n🎉 Seed data created successfully!');
  console.log('=====================================');
  console.log('\n📊 Summary:');
  console.log(`  - Organizations: 3`);
  console.log(`  - Users: 6`);
  console.log(`  - Customers (Org1): ${customers.length}`);
  console.log(`  - Customers (Org2): ${org2Customers.length}`);
  console.log(`  - Notes: 10`);
  console.log(`  - Soft-deleted: 1`);
  console.log('\n🔐 Login Credentials:');
  console.log('  Acme Corporation (Org1):');
  console.log('    Admin:  admin@acme.com / password123');
  console.log('    Member: member@acme.com / password123');
  console.log('    Member: sarah@acme.com / password123');
  console.log('    Member: mike@acme.com / password123');
  console.log('\n  TechStart Inc (Org2):');
  console.log('    Admin:  admin@techstart.com / password123');
  console.log('    Member: member@techstart.com / password123');
  console.log('=====================================\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
