import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  OneToOne,
} from "typeorm";
import { Event } from "./Event";
import { Player } from "./Player";
import { Answer } from "./Answer";
import { Score } from "./Score";

@Entity({ name: "teams" })
@Index("uq_team_name_per_event", ["event_id", "name"], { unique: true })
export class Team {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ type: "bigint", unsigned: true })
  event_id!: string;

  @ManyToOne(() => Event, (e) => e.teams, { onDelete: "CASCADE" })
  @JoinColumn({ name: "event_id" })
  event!: Event;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  password_hash?: string;

  @Column({ type: "smallint", unsigned: true, default: 0 })
  manual_participants_count!: number;

  @Column({ type: "bigint", unsigned: true, nullable: true })
  captain_player_id!: string | null;

  @OneToOne(() => Player)
  @JoinColumn({ name: "captain_player_id" })
  captain?: Player | null;

  @CreateDateColumn()
  created_at!: Date;

  @OneToMany(() => Player, (p) => p.team)
  players!: Player[];

  @OneToMany(() => Answer, (a) => a.team)
  answers!: Answer[];

  @OneToMany(() => Score, (s) => s.team)
  scores!: Score[];
}
