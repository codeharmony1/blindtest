import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  UpdateDateColumn,
} from "typeorm";
import { Event } from "./Event";
import { Team } from "./Team";

@Entity({ name: "scores" })
@Index("uq_scores_team_event", ["event_id", "team_id"], { unique: true })
export class Score {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ type: "bigint", unsigned: true })
  event_id!: string;

  @ManyToOne(() => Event, { onDelete: "CASCADE" })
  @JoinColumn({ name: "event_id" })
  event!: Event;

  @Column({ type: "bigint", unsigned: true })
  team_id!: string;

  @ManyToOne(() => Team, (t) => t.scores, { onDelete: "CASCADE" })
  @JoinColumn({ name: "team_id" })
  team!: Team;

  @Column({ type: "int", unsigned: true, default: 0 })
  total_points!: number;

  @UpdateDateColumn()
  updated_at!: Date;
}
