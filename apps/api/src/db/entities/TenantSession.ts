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
import { Event } from "./Event";

export type PaymentStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED' | 'REFUNDED';

@Entity({ name: "tenant_sessions" })
export class TenantSession {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.sessions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id" })
  tenant!: Tenant;

  @Column({ type: "varchar", length: 36 })
  tenant_id!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  // Configuration de la session
  @Column({ type: "int" })
  duration_days!: number;

  @Column({ type: "datetime" })
  starts_at!: Date;

  @Column({ type: "datetime" })
  expires_at!: Date;

  @Column({ type: "int", default: 10 })
  max_events!: number;

  @Column({ type: "int", default: 100 })
  max_players_per_event!: number;

  @Column({ type: "int", default: 1000 })
  max_total_players!: number;

  // Informations de paiement
  @Column({
    type: "enum",
    enum: ['PENDING', 'PAID', 'EXPIRED', 'CANCELLED', 'REFUNDED'],
    default: 'PENDING'
  })
  payment_status!: PaymentStatus;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount_paid!: number;

  @Column({ type: "varchar", length: 3, default: 'EUR' })
  currency!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  payment_reference?: string; // Stripe Payment Intent ID

  @Column({ type: "varchar", length: 255, nullable: true })
  stripe_checkout_session_id?: string;

  @Column({ type: "datetime", nullable: true })
  paid_at?: Date;

  // Métadonnées
  @Column({ type: "longtext", nullable: true })
  metadata_json?: string;

  @Column({ type: "boolean", default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // Relations
  @OneToMany(() => Event, (event) => event.session)
  events!: Event[];

  // Index pour optimiser les requêtes
  @Index("idx_tenant_session_dates", ["tenant_id", "starts_at", "expires_at"])
  static tenantSessionDates: any;

  @Index("idx_session_payment", ["payment_status", "expires_at"])
  static sessionPayment: any;

  // Méthodes helper
  getMetadata(): Record<string, any> {
    try {
      return this.metadata_json ? JSON.parse(this.metadata_json) : {};
    } catch {
      return {};
    }
  }

  setMetadata(metadata: Record<string, any>): void {
    this.metadata_json = JSON.stringify(metadata);
  }

  isActive(): boolean {
    const now = new Date();
    return (
      this.is_active &&
      this.payment_status === 'PAID' &&
      now >= this.starts_at &&
      now <= this.expires_at
    );
  }

  isExpired(): boolean {
    return new Date() > this.expires_at;
  }

  isPaid(): boolean {
    return this.payment_status === 'PAID';
  }

  getDaysRemaining(): number {
    if (this.isExpired()) return 0;
    const now = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.max(0, Math.ceil((this.expires_at.getTime() - now.getTime()) / msPerDay));
  }

  getEventsRemaining(): number {
    // TODO: Calculer depuis les events liés
    return Math.max(0, this.max_events - 0);
  }

  getUsageStats(): {
    eventsUsed: number;
    eventsRemaining: number;
    playersUsed: number;
    playersRemaining: number;
    daysRemaining: number;
  } {
    // TODO: Implémenter le calcul réel depuis les données
    return {
      eventsUsed: 0,
      eventsRemaining: this.getEventsRemaining(),
      playersUsed: 0,
      playersRemaining: this.max_total_players,
      daysRemaining: this.getDaysRemaining(),
    };
  }

  canCreateEvent(): boolean {
    return this.isActive() && this.getEventsRemaining() > 0;
  }

  markAsPaid(paymentReference: string): void {
    this.payment_status = 'PAID';
    this.payment_reference = paymentReference;
    this.paid_at = new Date();
  }

  expire(): void {
    this.payment_status = 'EXPIRED';
    this.is_active = false;
  }
}