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

export type StaffRole = "ADMIN" | "DJ" | "DISPLAY";

@Entity({ name: "event_staff" })
@Index("uq_event_staff", ["event_id", "organizer_id", "role"], { unique: true })
export class EventStaff {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ type: "bigint", unsigned: true })
  event_id!: string;

  @Column({ type: "bigint", unsigned: true })
  organizer_id!: string;

  @Column({ type: "enum", enum: ["ADMIN", "DJ", "DISPLAY"] })
  role!: StaffRole;

  @CreateDateColumn()
  created_at!: Date;

  @ManyToOne(() => Event, (e) => e.staff, { onDelete: "CASCADE" })
  @JoinColumn({ name: "event_id" })
  event!: Event;

  @ManyToOne(() => Organizer, (o) => o.staff, { onDelete: "CASCADE" })
  @JoinColumn({ name: "organizer_id" })
  organizer!: Organizer;
}
