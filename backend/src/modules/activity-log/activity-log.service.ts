import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { ActivityAction } from '@prisma/client';
import { Prisma } from '@prisma/client';

@Injectable()
export class ActivityLogService {
  constructor(private prisma: PrismaService) {}

  async create(
    entityType: string,
    entityId: string,
    action: ActivityAction,
    performedById: string,
    organizationId: string,
    metadata?: Prisma.JsonValue,
  ) {
    return this.prisma.activityLog.create({
      data: {
        entityType,
        entityId,
        action,
        performedById,
        organizationId,
        metadata: metadata as any,
      },
    });
  }

  async findAll(organizationId: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where: { organizationId },
        include: {
          performedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.activityLog.count({
        where: { organizationId },
      }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByEntity(
    entityType: string,
    entityId: string,
    organizationId: string,
  ) {
    return this.prisma.activityLog.findMany({
      where: {
        entityType,
        entityId,
        organizationId,
      },
      include: {
        performedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
