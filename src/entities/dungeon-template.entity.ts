import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('dungeon_templates')
export class DungeonTemplate {
  @PrimaryGeneratedColumn('uuid')
  templateId: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  dungeonName: string;

  @Column({ type: 'json' })
  bosses: string[]; // BOSS 列表，如：['老一', '老二', '老三']

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
