import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { AssignCustomerDto } from './dto/assign-customer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrganizationId, CurrentUser } from '../../common/decorators/organization.decorator';

@ApiTags('customers')
@Controller('customers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Create customer' })
  create(
    @Body() createCustomerDto: CreateCustomerDto,
    @OrganizationId() organizationId: string,
    @CurrentUser() user: any,
  ) {
    return this.customersService.create(createCustomerDto, organizationId, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all customers with pagination and search' })
  findAll(
    @OrganizationId() organizationId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('search') search?: string,
  ) {
    return this.customersService.findAll(
      organizationId,
      parseInt(page),
      parseInt(limit),
      search,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by ID' })
  findOne(@Param('id') id: string, @OrganizationId() organizationId: string) {
    return this.customersService.findOne(id, organizationId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer' })
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @OrganizationId() organizationId: string,
    @CurrentUser() user: any,
  ) {
    return this.customersService.update(id, updateCustomerDto, organizationId, user.id);
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'Assign customer to user (max 5 per user)' })
  assignCustomer(
    @Param('id') id: string,
    @Body() assignCustomerDto: AssignCustomerDto,
    @OrganizationId() organizationId: string,
    @CurrentUser() user: any,
  ) {
    return this.customersService.assignCustomer(
      id,
      assignCustomerDto,
      organizationId,
      user.id,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete customer' })
  remove(
    @Param('id') id: string,
    @OrganizationId() organizationId: string,
    @CurrentUser() user: any,
  ) {
    return this.customersService.remove(id, organizationId, user.id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft deleted customer' })
  restore(
    @Param('id') id: string,
    @OrganizationId() organizationId: string,
    @CurrentUser() user: any,
  ) {
    return this.customersService.restore(id, organizationId, user.id);
  }
}
