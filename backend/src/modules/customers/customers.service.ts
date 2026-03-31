import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { AssignCustomerDto } from './dto/assign-customer.dto';
import { Prisma } from '@prisma/client';

const MAX_ASSIGNMENTS_PER_USER = 5;

@Injectable()
export class CustomersService {
  constructor(
    private prisma: PrismaService,
    private activityLogService: ActivityLogService,
  ) {}

  async create(
    createCustomerDto: CreateCustomerDto,
    organizationId: string,
    userId: string,
  ) {
    const customer = await this.prisma.customer.create({
      data: {
        ...createCustomerDto,
        organizationId,
        assignedToId: createCustomerDto.assignedToId || userId,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await this.activityLogService.create(
      'customer',
      customer.id,
      'CUSTOMER_CREATED',
      userId,
      organizationId,
      {
        customerName: customer.name,
        customerEmail: customer.email,
        autoAssigned: !createCustomerDto.assignedToId,
      },
    );

    return customer;
  }

  async findAll(
    organizationId: string,
    page: number = 1,
    limit: number = 20,
    search?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = {
      organizationId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              notes: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data: customers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, organizationId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        notes: {
          where: {
            customer: {
              deletedAt: null,
            },
          },
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async update(
    id: string,
    updateCustomerDto: UpdateCustomerDto,
    organizationId: string,
    userId: string,
  ) {
    const existing = await this.prisma.customer.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Customer not found');
    }

    const customer = await this.prisma.customer.update({
      where: { id },
      data: updateCustomerDto,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await this.activityLogService.create(
      'customer',
      customer.id,
      'CUSTOMER_UPDATED',
      userId,
      organizationId,
      {
        changes: updateCustomerDto as any,
      },
    );

    return customer;
  }

  async assignCustomer(
    id: string,
    assignCustomerDto: AssignCustomerDto,
    organizationId: string,
    userId: string,
  ) {
    return await this.prisma.$transaction(
      async (tx) => {
        const customer = await tx.customer.findFirst({
          where: { id, organizationId, deletedAt: null },
        });

        if (!customer) {
          throw new NotFoundException('Customer not found');
        }

        const user = await tx.user.findFirst({
          where: {
            id: assignCustomerDto.userId,
            organizationId,
          },
        });

        if (!user) {
          throw new NotFoundException('User not found');
        }

        // Lock the user's assigned customers to prevent race conditions
        const lockedCustomers = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT id
          FROM customers
          WHERE "assignedToId" = ${assignCustomerDto.userId}
            AND "deletedAt" IS NULL
            AND id != ${id}
          FOR UPDATE
        `;

        const count = lockedCustomers.length;

        if (count >= MAX_ASSIGNMENTS_PER_USER) {
          throw new ConflictException(
            `User already has ${MAX_ASSIGNMENTS_PER_USER} active assignments. Cannot assign more customers.`,
          );
        }

        const updatedCustomer = await tx.customer.update({
          where: { id },
          data: {
            assignedToId: assignCustomerDto.userId,
          },
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        await this.activityLogService.create(
          'customer',
          updatedCustomer.id,
          'CUSTOMER_ASSIGNED',
          userId,
          organizationId,
          {
            assignedToId: assignCustomerDto.userId,
            assignedToName: user.name,
          },
        );

        return updatedCustomer;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 10000,
      },
    );
  }

  async remove(id: string, organizationId: string, userId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const deleted = await this.prisma.customer.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    await this.activityLogService.create(
      'customer',
      deleted.id,
      'CUSTOMER_DELETED',
      userId,
      organizationId,
      {
        customerName: customer.name,
      },
    );

    return { message: 'Customer soft deleted successfully' };
  }

  async restore(id: string, organizationId: string, userId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, organizationId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (!customer.deletedAt) {
      throw new BadRequestException('Customer is not deleted');
    }

    const restored = await this.prisma.customer.update({
      where: { id },
      data: {
        deletedAt: null,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await this.activityLogService.create(
      'customer',
      restored.id,
      'CUSTOMER_RESTORED',
      userId,
      organizationId,
      {
        customerName: customer.name,
      },
    );

    return restored;
  }
}
