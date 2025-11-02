import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('weekly_task_templates')
export class WeeklyTaskTemplate {
  @PrimaryGeneratedColumn('uuid')
  templateId: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  taskName: string;

  @Column({ type: 'int', default: 1 })
  targetCount: number; // 每周所需完成的目标次数

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}