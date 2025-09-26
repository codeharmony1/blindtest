import { Injectable } from '@angular/core';

export interface PlayerSession {
  eventCode: string;
  teamId: string;
  playerId: string;
  nickname: string;
  teamToken: string;
  isCaptain: boolean;
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private KEY = 'bt.player.session';

  save(s: PlayerSession) {
    localStorage.setItem(this.KEY, JSON.stringify(s));
  }
  load(): PlayerSession | null {
    const v = localStorage.getItem(this.KEY);
    return v ? JSON.parse(v) : null;
  }
  clear() {
    localStorage.removeItem(this.KEY);
  }
}
