import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { CustomersModule } from './modules/customers/customers.module';
import { NotesModule } from './modules/notes/notes.module';
import { ActivityLogModule } from './modules/activity-log/activity-log.module';
import { PrismaService } from './config/prisma.service';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    OrganizationsModule,
    CustomersModule,
    NotesModule,
    ActivityLogModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
