import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Event } from "./Event";
import { Team } from "./Team";

@Entity({ name: "players" })
@Index("uq_player_unique_in_event", ["event_id", "nickname"], { unique: true })
@Index("idx_player_tenant", ["tenant_id", "event_id"])
export class Player {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ type: "bigint", unsigned: true })
  event_id!: string;

  // Support multi-tenant
  @Index()
  @Column({ type: "varchar", length: 36 })
  tenant_id!: string;

  @ManyToOne(() => Event, (e) => e.teams, { onDelete: "CASCADE" })
  @JoinColumn({ name: "event_id" })
  event!: Event;

  @Column({ type: "bigint", unsigned: true })
  team_id!: string;

  @ManyToOne(() => Team, (t) => t.players, { onDelete: "CASCADE" })
  @JoinColumn({ name: "team_id" })
  team!: Team;

  @Column({ type: "varchar", length: 100 })
  nickname!: string;

  @Column({ type: "tinyint", width: 1, default: 0 })
  is_captain!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  // Méthodes helper multi-tenant
  isOwnedByTenant(tenantId: string): boolean {
    return this.tenant_id === tenantId;
  }

  canBeAccessedByTenant(tenantId: string): boolean {
    return this.tenant_id === tenantId;
  }
}
