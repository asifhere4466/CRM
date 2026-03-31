import { Controller, Get, Query, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ActivityLogService } from './activity-log.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrganizationId } from '../../common/decorators/organization.decorator';

@ApiTags('activity-logs')
@Controller('activity-logs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Get()
  @ApiOperation({ summary: 'Get all activity logs' })
  findAll(
    @OrganizationId() organizationId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    return this.activityLogService.findAll(
      organizationId,
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get(':entityType/:entityId')
  @ApiOperation({ summary: 'Get activity logs for specific entity' })
  findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @OrganizationId() organizationId: string,
  ) {
    return this.activityLogService.findByEntity(
      entityType,
      entityId,
      organizationId,
    );
  }
}
