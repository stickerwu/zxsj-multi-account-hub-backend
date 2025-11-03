import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgressService } from './progress.service';
import { ProgressController } from './progress.controller';
import { WeeklyProgress } from '../entities/weekly-progress.entity';
import { Account } from '../entities/account.entity';
import { SharedAccount } from '../entities/shared-account.entity';
import { UserAccountRelation } from '../entities/user-account-relation.entity';
import { SharedAccountPermissionService } from '../shared-accounts/services/shared-account-permission.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WeeklyProgress,
      Account,
      SharedAccount,
      UserAccountRelation,
    ]),
  ],
  controllers: [ProgressController],
  providers: [ProgressService, SharedAccountPermissionService],
  exports: [ProgressService],
})
export class ProgressModule {}
