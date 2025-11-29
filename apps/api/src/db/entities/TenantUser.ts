import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
} from "typeorm";
import { Tenant } from "./Tenant";
import { EventStaff } from "./EventStaff";

export type TenantUserRole = 'OWNER' | 'ADMIN' | 'DJ' | 'VIEWER';

@Entity({ name: "tenant_users" })
export class TenantUser {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.users, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id" })
  tenant!: Tenant;

  @Column({ type: "varchar", length: 36 })
  tenant_id!: string;

  @Index()
  @Column({ type: "varchar", length: 255 })
  email!: string;

  @Column({ type: "varchar", length: 255 })
  password_hash!: string;

  @Column({
    type: "enum",
    enum: ['OWNER', 'ADMIN', 'DJ', 'VIEWER'],
    default: 'VIEWER'
  })
  role!: TenantUserRole;

  @Column({ type: "varchar", length: 255, nullable: true })
  display_name?: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  first_name?: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  last_name?: string;

  @Column({ type: "datetime", nullable: true })
  last_login_at?: Date;

  @Column({ type: "datetime", nullable: true })
  email_verified_at?: Date;

  @Column({ type: "boolean", default: true })
  is_active!: boolean;

  @Column({ type: "longtext", nullable: true })
  preferences_json?: string; // Préférences utilisateur

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // Relations
  @OneToMany(() => EventStaff, (staff) => staff.tenant_user)
  event_assignments!: EventStaff[];

  // Index composé pour unicité email par tenant
  @Index("idx_tenant_user_email", ["tenant_id", "email"], { unique: true })
  static uniqueEmailPerTenant: any;

  // Méthodes helper
  getFullName(): string {
    if (this.first_name && this.last_name) {
      return `${this.first_name} ${this.last_name}`;
    }
    return this.display_name || this.email;
  }

  getPreferences(): Record<string, any> {
    try {
      return this.preferences_json ? JSON.parse(this.preferences_json) : {};
    } catch {
      return {};
    }
  }

  setPreferences(preferences: Record<string, any>): void {
    this.preferences_json = JSON.stringify(preferences);
  }

  isOwner(): boolean {
    return this.role === 'OWNER';
  }

  isAdmin(): boolean {
    return this.role === 'OWNER' || this.role === 'ADMIN';
  }

  canManageUsers(): boolean {
    return this.role === 'OWNER';
  }

  canCreateEvents(): boolean {
    return this.role === 'OWNER' || this.role === 'ADMIN';
  }

  canManageEvents(): boolean {
    return this.role === 'OWNER' || this.role === 'ADMIN';
  }

  canControlDJ(): boolean {
    return this.role === 'OWNER' || this.role === 'ADMIN' || this.role === 'DJ';
  }

  updateLastLogin(): void {
    this.last_login_at = new Date();
  }
}