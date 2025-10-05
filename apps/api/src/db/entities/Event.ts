import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
} from "typeorm";
import { Organizer } from "./Organizer";
import { EventStaff } from "./EventStaff";
import { Team } from "./Team";
import { Round } from "./Round";
import { Tenant } from "./Tenant";
import { TenantSession } from "./TenantSession";

@Entity({ name: "events" })
export class Event {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  // Relations multi-tenant
  @ManyToOne(() => Tenant, (tenant) => tenant.events, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id" })
  tenant!: Tenant;

  @Index()
  @Column({ type: "varchar", length: 36 })
  tenant_id!: string;

  @ManyToOne(() => TenantSession, (session) => session.events, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "session_id" })
  session?: TenantSession;

  @Column({ type: "varchar", length: 36, nullable: true })
  session_id?: string;

  // Relation legacy (sera dépréciée)
  @ManyToOne(() => Organizer, (o) => o.events, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "organizer_id" })
  organizer?: Organizer;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 16 })
  code!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "longtext", nullable: true })
  settings_json?: string; // JSON string

  @CreateDateColumn()
  created_at!: Date;

  @OneToMany(() => EventStaff, (es) => es.event)
  staff!: EventStaff[];

  @OneToMany(() => Team, (t) => t.event)
  teams!: Team[];

  @OneToMany(() => Round, (r) => r.event)
  rounds!: Round[];

  // Index composé pour isolation tenant
  @Index("idx_event_tenant", ["tenant_id", "code"], { unique: true })
  static tenantEventCode: any;

  @Index("idx_event_tenant_session", ["tenant_id", "session_id"])
  static tenantSession: any;

  // Méthodes helper multi-tenant
  isOwnedByTenant(tenantId: string): boolean {
    return this.tenant_id === tenantId;
  }

  belongsToSession(sessionId: string): boolean {
    return this.session_id === sessionId;
  }

  canBeAccessedByTenant(tenantId: string): boolean {
    return this.tenant_id === tenantId;
  }
}
