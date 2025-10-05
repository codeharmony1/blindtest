import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import { Event } from "./Event";
import { RoundSong } from "./RoundSong";

@Entity({ name: "rounds" })
@Index("idx_round_tenant", ["tenant_id", "event_id"])
export class Round {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ type: "bigint", unsigned: true })
  event_id!: string;

  // Support multi-tenant
  @Index()
  @Column({ type: "varchar", length: 36 })
  tenant_id!: string;

  @ManyToOne(() => Event, (e) => e.rounds, { onDelete: "CASCADE" })
  @JoinColumn({ name: "event_id" })
  event!: Event;

  @Column({ type: "varchar", length: 255, nullable: true })
  name!: string | null;

  @Column({ type: "smallint", unsigned: true, default: 15 })
  default_duration_s!: number;

  @Column({ type: "smallint", unsigned: true, default: 20 })
  total_songs!: number;

  @CreateDateColumn()
  created_at!: Date;

  @OneToMany(() => RoundSong, (rs) => rs.round)
  songs!: RoundSong[];

  // Méthodes helper multi-tenant
  isOwnedByTenant(tenantId: string): boolean {
    return this.tenant_id === tenantId;
  }

  canBeAccessedByTenant(tenantId: string): boolean {
    return this.tenant_id === tenantId;
  }
}
