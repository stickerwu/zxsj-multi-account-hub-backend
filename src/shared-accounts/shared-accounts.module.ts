import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedAccount } from '../entities/shared-account.entity';
import { UserAccountRelation } from '../entities/user-account-relation.entity';
import { SharedAccountsController } from './controllers/shared-accounts.controller';
import { SharedAccountsService } from './services/shared-accounts.service';
import { SharedAccountPermissionService } from './services/shared-account-permission.service';

/**
 * 共享账号模块
 * 提供多用户共享账号管理功能
 */
@Module({
  imports: [TypeOrmModule.forFeature([SharedAccount, UserAccountRelation])],
  controllers: [SharedAccountsController],
  providers: [SharedAccountsService, SharedAccountPermissionService],
  exports: [SharedAccountsService, SharedAccountPermissionService],
})
export class SharedAccountsModule {}
