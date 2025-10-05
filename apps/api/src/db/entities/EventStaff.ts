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
import { Organizer } from "./Organizer";
import { TenantUser } from "./TenantUser";

export type StaffRole = "ADMIN" | "DJ" | "DISPLAY";

@Entity({ name: "event_staff" })
@Index("uq_event_staff_legacy", ["event_id", "organizer_id", "role"], { unique: true })
@Index("uq_event_staff_tenant", ["event_id", "tenant_user_id", "role"], { unique: true })
export class EventStaff {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ type: "bigint", unsigned: true })
  event_id!: string;

  // Relations multi-tenant (nouveau)
  @ManyToOne(() => TenantUser, (user) => user.event_assignments, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_user_id" })
  tenant_user?: TenantUser;

  @Column({ type: "varchar", length: 36, nullable: true })
  tenant_user_id?: string;

  // Relations legacy (pour compatibilité)
  @Column({ type: "bigint", unsigned: true, nullable: true })
  organizer_id?: string;

  @Column({ type: "enum", enum: ["ADMIN", "DJ", "DISPLAY"] })
  role!: StaffRole;

  @CreateDateColumn()
  created_at!: Date;

  @ManyToOne(() => Event, (e) => e.staff, { onDelete: "CASCADE" })
  @JoinColumn({ name: "event_id" })
  event!: Event;

  @ManyToOne(() => Organizer, (o) => o.staff, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "organizer_id" })
  organizer?: Organizer;

  // Méthodes helper multi-tenant
  isNewTenantSystem(): boolean {
    return !!this.tenant_user_id;
  }

  getUser(): TenantUser | Organizer | undefined {
    return this.tenant_user || this.organizer;
  }

  getUserEmail(): string | undefined {
    return this.tenant_user?.email || this.organizer?.email;
  }

  getUserDisplayName(): string | undefined {
    return this.tenant_user?.getFullName() || this.organizer?.display_name;
  }
}
