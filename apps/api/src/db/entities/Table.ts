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
import { Team } from "./Team";

@Entity({ name: "tables" })
@Index("uq_table_name_per_event", ["event_id", "name"], { unique: true })
@Index("idx_table_tenant", ["tenant_id", "event_id"])
export class Table {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ type: "bigint", unsigned: true })
  event_id!: string;

  // Support multi-tenant
  @Index()
  @Column({ type: "varchar", length: 36 })
  tenant_id!: string;

  @ManyToOne(() => Event, { onDelete: "CASCADE" })
  @JoinColumn({ name: "event_id" })
  event!: Event;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @CreateDateColumn()
  created_at!: Date;

  @OneToMany(() => Team, (t) => t.table)
  teams!: Team[];

  // Méthodes helper multi-tenant
  isOwnedByTenant(tenantId: string): boolean {
    return this.tenant_id === tenantId;
  }

  canBeAccessedByTenant(tenantId: string): boolean {
    return this.tenant_id === tenantId;
  }
}
