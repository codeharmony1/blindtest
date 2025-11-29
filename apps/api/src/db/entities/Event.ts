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

  @Column({ type: "enum", enum: ["TEAM", "SOLO"], default: "TEAM" })
  game_mode!: "TEAM" | "SOLO";

  @Column({ type: "boolean", default: false })
  table_mode!: boolean;

  @Column({
    type: "enum",
    enum: ["DRAFT", "ACTIVE", "COMPLETED"],
    default: "ACTIVE"
  })
  status!: "DRAFT" | "ACTIVE" | "COMPLETED";

  @Column({ type: "varchar", length: 255, nullable: true })
  dj_pin_hash?: string; // Hash bcrypt du PIN DJ (6 chiffres)

  @Column({ type: "longtext", nullable: true })
  settings_json?: string; // JSON string

  @CreateDateColumn()
  created_at!: Date;

  @Column({ type: "datetime", nullable: true })
  completed_at?: Date | null;

  @Column({ type: "datetime", nullable: true })
  start_date?: Date | null; // Date de début planifiée de l'événement

  @Column({ type: "datetime", nullable: true })
  end_date?: Date | null; // Date de fin planifiée de l'événement

  @Column({ type: "datetime", nullable: true })
  actual_start_date?: Date | null; // Date réelle de démarrage (quand DJ démarre)

  @Column({ type: "datetime", nullable: true })
  code_expires_at?: Date | null; // Date d'expiration du code (end_date + buffer)

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

  // Méthodes helper pour le lifecycle
  isCodeActive(): boolean {
    const now = new Date();
    if (!this.code_expires_at) return true; // Codes sans expiration restent actifs (legacy)
    return now <= this.code_expires_at;
  }

  canReuseCode(): boolean {
    return !this.isCodeActive();
  }

  isEventActive(): boolean {
    const now = new Date();
    if (!this.start_date || !this.end_date) return this.status === 'ACTIVE';
    return now >= this.start_date && now <= this.end_date && this.status === 'ACTIVE';
  }

  isEventExpired(): boolean {
    const now = new Date();
    if (!this.code_expires_at) return false;
    return now > this.code_expires_at;
  }
}
