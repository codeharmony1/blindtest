import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { RoundSong } from "./RoundSong";
import { Team } from "./Team";

@Entity({ name: "answers" })
@Index("uq_answer_per_song_team", ["round_song_id", "team_id"], {
  unique: true,
})
export class Answer {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ type: "bigint", unsigned: true })
  round_song_id!: string;

  @ManyToOne(() => RoundSong, (rs) => rs.answers, { onDelete: "CASCADE" })
  @JoinColumn({ name: "round_song_id" })
  song!: RoundSong;

  @Column({ type: "bigint", unsigned: true })
  team_id!: string;

  @ManyToOne(() => Team, (t) => t.answers, { onDelete: "CASCADE" })
  @JoinColumn({ name: "team_id" })
  team!: Team;

  @Column({ type: "varchar", length: 255 })
  text_raw!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  text_norm!: string | null;

  @Column({ type: "datetime", precision: 3 })
  submitted_at!: Date;

  @Column({ type: "tinyint", width: 1, default: 0 })
  match_title!: boolean;

  @Column({ type: "tinyint", width: 1, default: 0 })
  match_artist!: boolean;

  @Column({ type: "smallint", unsigned: true, default: 0 })
  points!: number;
}
