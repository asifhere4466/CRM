import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { CreateNoteDto } from './dto/create-note.dto';

@Injectable()
export class NotesService {
  constructor(
    private prisma: PrismaService,
    private activityLogService: ActivityLogService,
  ) {}

  async create(
    createNoteDto: CreateNoteDto,
    organizationId: string,
    userId: string,
  ) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: createNoteDto.customerId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const note = await this.prisma.note.create({
      data: {
        content: createNoteDto.content,
        customerId: createNoteDto.customerId,
        organizationId,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await this.activityLogService.create(
      'customer',
      customer.id,
      'NOTE_ADDED',
      userId,
      organizationId,
      {
        noteId: note.id,
        notePreview: createNoteDto.content.substring(0, 50),
      },
    );

    return note;
  }

  async findByCustomer(customerId: string, organizationId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return this.prisma.note.findMany({
      where: {
        customerId,
        organizationId,
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
    });
  }
}
