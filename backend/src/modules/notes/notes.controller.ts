import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrganizationId, CurrentUser } from '../../common/decorators/organization.decorator';

@ApiTags('notes')
@Controller('notes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @ApiOperation({ summary: 'Create note for customer' })
  create(
    @Body() createNoteDto: CreateNoteDto,
    @OrganizationId() organizationId: string,
    @CurrentUser() user: any,
  ) {
    return this.notesService.create(createNoteDto, organizationId, user.id);
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Get all notes for a customer' })
  findByCustomer(
    @Param('customerId') customerId: string,
    @OrganizationId() organizationId: string,
  ) {
    return this.notesService.findByCustomer(customerId, organizationId);
  }
}
