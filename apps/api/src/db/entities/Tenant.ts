import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from "typeorm";
import { TenantUser } from "./TenantUser";
import { TenantSession } from "./TenantSession";
import { Event } from "./Event";

export type SubscriptionPlan = 'DEMO' | 'PER_EVENT' | 'MONTHLY';
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PAST_DUE' | 'SUSPENDED';

@Entity({ name: "tenants" })
export class Tenant {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 100, nullable: true })
  slug?: string; // URL slug: my-company -> blindtest.com/my-company

  @Column({
    type: "enum",
    enum: ['DEMO', 'PER_EVENT', 'MONTHLY'],
    default: 'DEMO'
  })
  subscription_plan!: SubscriptionPlan;

  @Column({
    type: "enum",
    enum: ['ACTIVE', 'EXPIRED', 'CANCELLED', 'PAST_DUE', 'SUSPENDED'],
    default: 'ACTIVE'
  })
  subscription_status!: SubscriptionStatus;

  @Column({ type: "datetime", nullable: true })
  subscription_expires_at?: Date;

  @Column({ type: "varchar", length: 255 })
  billing_email!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  stripe_customer_id?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  stripe_subscription_id?: string;

  // Limites par plan
  @Column({ type: "int", default: 1 })
  max_concurrent_events!: number;

  @Column({ type: "int", default: 20 })
  max_players_per_event!: number;

  @Column({ type: "int", default: 5 })
  max_users!: number;

  @Column({ type: "int", nullable: true }) // Null = illimité
  max_songs_per_event?: number;

  // Configuration tenant
  @Column({ type: "longtext", nullable: true })
  settings_json?: string; // JSON string pour config custom

  @Column({ type: "boolean", default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // Relations
  @OneToMany(() => TenantUser, (user) => user.tenant)
  users!: TenantUser[];

  @OneToMany(() => TenantSession, (session) => session.tenant)
  sessions!: TenantSession[];

  @OneToMany(() => Event, (event) => event.tenant)
  events!: Event[];

  // Méthodes helper
  getSettings(): Record<string, any> {
    try {
      return this.settings_json ? JSON.parse(this.settings_json) : {};
    } catch {
      return {};
    }
  }

  setSettings(settings: Record<string, any>): void {
    this.settings_json = JSON.stringify(settings);
  }

  isSubscriptionActive(): boolean {
    if (this.subscription_status !== 'ACTIVE') return false;
    if (!this.subscription_expires_at) return true; // Plans permanents
    return new Date() < this.subscription_expires_at;
  }

  canCreateEvent(): boolean {
    return this.is_active && this.isSubscriptionActive();
  }

  getRemainingEvents(): number {
    // TODO: Calculer depuis les events actifs
    return Math.max(0, this.max_concurrent_events - 0);
  }
}