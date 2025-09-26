import { Routes } from '@angular/router';
import { JoinComponent } from './join.component';
import { TeamSelectComponent } from './team-select.component';
import { RoundComponent } from './round.component';
import { LeaderboardComponent } from './leaderboard.component';

export const PLAYER_ROUTES: Routes = [
  { path: '', component: JoinComponent },
  { path: 'team', component: TeamSelectComponent },
  { path: 'round', component: RoundComponent },
  { path: 'leaderboard', component: LeaderboardComponent },
];
