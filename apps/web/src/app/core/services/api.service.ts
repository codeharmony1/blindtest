import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  // Events
  getEventPublic(code: string) {
    return this.http.get<{ code: string; name: string; settings: any }>(
      `${this.base}/events/${code}/public`,
    );
  }
  getRounds(code: string) {
    const headers = new HttpHeaders().set('x-client-type', 'dj');
    return this.http.get<
      Array<{ id: string; name: string | null; defaultDuration: number; totalSongs: number }>
    >(`${this.base}/events/${code}/rounds`, { headers });
  }

  // Teams / Players
  getTeams(code: string) {
    return this.http.get<
      Array<{
        id: string;
        name: string;
        captainPlayerId: string | null;
        manualParticipantsCount: number;
      }>
    >(`${this.base}/events/${code}/teams`);
  }
  createTeam(code: string, name: string) {
    return this.http.post<{ id: string; name: string }>(`${this.base}/events/${code}/teams`, {
      name,
    });
  }
  joinEvent(code: string, teamId: string, nickname: string) {
    return this.http.post<{
      teamToken: string;
      player: { id: string; nickname: string; teamId: string; isCaptain: boolean };
    }>(`${this.base}/events/${code}/join`, { teamId, nickname });
  }

  // Answers (HTTP fallback)
  submitAnswer(songId: string, text: string, teamToken: string) {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${teamToken}`);
    return this.http.post(`${this.base}/songs/${songId}/answers`, { text }, { headers });
  }

  // Live controls DJ
  nextSong(roundId: string, duration?: number) {
    return this.http.post<{
      previousSongId: string | null;
      nextSongId: string | null;
      duration: number;
      endsAt: string;
    }>(`${this.base}/rounds/${roundId}/next`, duration ? { duration } : {});
  }
  patchSong(
    songId: string,
    payload: { title?: string; artist?: string; aliases?: string[]; duration?: number },
  ) {
    return this.http.patch(`${this.base}/songs/${songId}`, payload);
  }
  openSong(songId: string, duration?: number) {
    return this.http.post(`${this.base}/songs/${songId}/open`, duration ? { duration } : {});
  }
  closeSong(songId: string) {
    return this.http.post(`${this.base}/songs/${songId}/close`, {});
  }
  gradeSong(songId: string, payload?: { title?: string; artist?: string }) {
    return this.http.post(`${this.base}/songs/${songId}/grade`, payload ?? {});
  }

  // Leaderboard
  getLeaderboard(code: string) {
    return this.http.get<
      Array<{ teamId: string; name: string; totalPoints: number; rank: number }>
    >(`${this.base}/events/${code}/leaderboard`);
  }

  // Teams management
  setCaptain(teamId: string, playerId: string) {
    return this.http.post<{
      teamId: string;
      captainPlayerId: string;
      captainNickname: string;
    }>(`${this.base}/teams/${teamId}/captain`, { playerId });
  }

  updateManualParticipants(teamId: string, count: number) {
    return this.http.patch<{
      id: string;
      name: string;
      manualParticipantsCount: number;
    }>(`${this.base}/teams/${teamId}/participants`, { manualParticipantsCount: count });
  }

  // DJ Correction interface
  getSongAnswers(songId: string) {
    return this.http.get<{
      songId: string;
      songTitle?: string;
      songArtist?: string;
      status: string;
      answers: Array<{
        teamId: string;
        teamName: string;
        textRaw: string;
        submittedAt: string;
        matchTitle: boolean;
        matchArtist: boolean;
        points: number;
        canOverride: boolean;
      }>;
      totalAnswers: number;
    }>(`${this.base}/songs/${songId}/answers`);
  }

  overrideAnswer(
    songId: string,
    teamId: string,
    override: {
      matchTitle: boolean;
      matchArtist: boolean;
      points: number;
    },
  ) {
    return this.http.post<{
      teamId: string;
      matchTitle: boolean;
      matchArtist: boolean;
      points: number;
      updated: boolean;
    }>(`${this.base}/songs/${songId}/answers/${teamId}/override`, override);
  }

  // Auth admin/DJ
  login(email: string, password: string, eventCode: string, role: string) {
    return this.http.post<{
      token: string;
      organizer: { id: string; email: string; displayName?: string };
      event: { code: string; name: string };
      role: string;
    }>(`${this.base}/auth/login`, { email, password, eventCode, role });
  }

  register(email: string, password: string, displayName?: string) {
    return this.http.post<{
      id: string;
      email: string;
      displayName?: string;
      createdAt: string;
    }>(`${this.base}/auth/register`, { email, password, displayName });
  }

  // CSV Import/Export
  importPlaylistCSV(roundId: string, formData: FormData) {
    return this.http.post<{
      roundId: string;
      imported: number;
      songs: Array<{
        id: string;
        idx: number;
        title: string;
        artist: string;
        aliases: string[];
        duration?: number;
      }>;
      message: string;
    }>(`${this.base}/rounds/${roundId}/import-csv`, formData);
  }

  exportScoresCSV(eventCode: string) {
    return this.http.get(`${this.base}/events/${eventCode}/export-scores`, {
      responseType: 'blob',
    });
  }

  exportDetailedScoresCSV(eventCode: string) {
    return this.http.get(`${this.base}/events/${eventCode}/export-detailed-scores`, {
      responseType: 'blob',
    });
  }

  // Event Settings
  getEventSettings(eventCode: string) {
    return this.http.get<{
      eventCode: string;
      eventName: string;
      settings: any;
      lastUpdated: string;
    }>(`${this.base}/events/${eventCode}/settings`);
  }

  updateEventSettings(eventCode: string, settings: any) {
    return this.http.put<{
      eventCode: string;
      settings: any;
      updated: boolean;
      message: string;
    }>(`${this.base}/events/${eventCode}/settings`, { settings });
  }

  getEventSettingsSchema(eventCode: string) {
    return this.http.get<{
      schema: any;
      defaults: any;
    }>(`${this.base}/events/${eventCode}/settings/schema`);
  }

  // Dashboard Stats
  getDashboardStats() {
    return this.http.get<{
      totalEvents: number;
      activeEvents: number;
      totalRounds: number;
      totalSongs: number;
      totalTeams: number;
    }>(`${this.base}/dashboard/stats`);
  }
}
