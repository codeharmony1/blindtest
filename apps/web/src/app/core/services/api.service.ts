import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  // Events
  getEventPublic(code: string) {
    return this.http.get<{ code: string; name: string; gameMode?: 'TEAM' | 'SOLO'; settings: any }>(
      `${this.base}/events/${code}/public`,
    );
  }
  getRounds(code: string) {
    const headers = new HttpHeaders().set('x-client-type', 'dj');
    return this.http.get<
      Array<{ id: string; name: string | null; defaultDuration: number; totalSongs: number }>
    >(`${this.base}/events/${code}/rounds`, { headers });
  }
  createRound(code: string, payload: { name?: string; defaultDuration?: number; totalSongs?: number }) {
    return this.http.post<{
      id: string;
      name: string | null;
      defaultDuration: number;
      totalSongs: number;
    }>(`${this.base}/events/${code}/rounds`, payload);
  }
  deleteRound(roundId: string) {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.base}/rounds/${roundId}`
    );
  }
  completeEvent(code: string) {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.base}/events/${code}/complete`,
      {}
    );
  }
  getRoundSongs(roundId: string) {
    return this.http
      .get<{
        songs: Array<{
          id: string;
          idx: number;
          mode: string;
          title: string | null;
          artist: string | null;
          status: string;
        }>;
      }>(`${this.base}/rounds/${roundId}/songs`)
      .pipe(map((response) => response.songs));
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

  // Tables
  getTables(code: string) {
    return this.http.get<
      Array<{
        id: string;
        name: string;
        teamsCount: number;
        createdAt: string;
      }>
    >(`${this.base}/events/${code}/tables`);
  }
  createTable(code: string, name: string) {
    return this.http.post<{ id: string; name: string; createdAt: string }>(
      `${this.base}/events/${code}/tables`,
      { name }
    );
  }
  joinTable(teamId: string, tableId: string) {
    return this.http.post<{
      teamId: string;
      teamName: string;
      tableId: string;
      tableName: string;
    }>(`${this.base}/teams/${teamId}/join-table`, { tableId });
  }
  getTableTeams(tableId: string) {
    return this.http.get<{
      tableId: string;
      tableName: string;
      teams: Array<{
        id: string;
        name: string;
        playersCount: number;
        manualParticipantsCount: number;
      }>;
    }>(`${this.base}/tables/${tableId}/teams`);
  }
  getTableLeaderboard(code: string) {
    return this.http.get<
      Array<{
        tableId: string;
        tableName: string;
        totalPoints: number;
        teamsCount: number;
        rank: number;
        teams?: Array<{
          id: string;
          name: string;
          points: number;
        }>;
      }>
    >(`${this.base}/events/${code}/table-leaderboard`);
  }
  getRoundTableScores(code: string, roundId: string) {
    return this.http.get<{
      roundNumber: number;
      roundId: string;
      tableScores: Array<{
        tableId: string;
        tableName: string;
        roundPoints: number;
        totalPoints: number;
        rank: number;
        teamsCount: number;
      }>;
    }>(`${this.base}/events/${code}/rounds/${roundId}/table-scores`);
  }

  joinEvent(code: string, teamId: string | null, nickname: string) {
    const body: any = { nickname };
    if (teamId) {
      body.teamId = teamId;
    }
    return this.http.post<{
      teamToken: string;
      player: { id: string; nickname: string; teamId: string; isCaptain: boolean };
    }>(`${this.base}/events/${code}/join`, body);
  }

  // Players management
  getPlayers(code: string) {
    return this.http.get<
      Array<{
        id: string;
        nickname: string;
        teamId: string;
        teamName: string;
        isCaptain: boolean;
        createdAt: string;
      }>
    >(`${this.base}/events/${code}/players`);
  }

  deletePlayer(playerId: string) {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.base}/players/${playerId}`
    );
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
  createSong(
    roundId: string,
    payload: {
      mode: 'freestyle' | 'prepared';
      idx: number;
      title?: string;
      artist?: string;
      group?: string;
      aliases?: string[];
      duration?: number;
    },
  ) {
    return this.http.post<{ id: string; idx: number; mode: string }>(
      `${this.base}/rounds/${roundId}/songs`,
      payload,
    );
  }
  patchSong(
    songId: string,
    payload: { title?: string; artist?: string; group?: string; aliases?: string[]; duration?: number; status?: string },
  ) {
    return this.http.patch(`${this.base}/songs/${songId}`, payload);
  }
  deleteSong(songId: string) {
    return this.http.delete(`${this.base}/songs/${songId}`);
  }
  openSong(songId: string, duration?: number) {
    return this.http.post(`${this.base}/songs/${songId}/open`, duration ? { duration } : {});
  }
  closeSong(songId: string) {
    return this.http.post<{ songId: string; status: string }>(`${this.base}/songs/${songId}/close`, {});
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

  // Round scores
  getRoundScores(code: string, roundId: string) {
    return this.http.get<{
      roundNumber: number;
      roundId: string;
      roundScores: Array<{
        teamId: string;
        name: string;
        roundPoints: number;
        totalPoints: number;
        rank: number;
      }>;
    }>(`${this.base}/events/${code}/rounds/${roundId}/scores`);
  }

  // Detailed scores by song
  getDetailedScores(code: string) {
    return this.http.get<{
      teams: Array<{ id: string; name: string; totalPoints: number }>;
      songs: Array<{
        id: string;
        roundIdx: number;
        songIdx: number;
        title: string;
        artist: string;
        teamScores: { [teamId: string]: number };
      }>;
      totalSongs: number;
      totalTeams: number;
    }>(`${this.base}/events/${code}/detailed-scores`);
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

  // Password Reset
  forgotPassword(email: string) {
    return this.http.post<{
      success: boolean;
      message: string;
    }>(`${this.base}/auth/forgot-password`, { email });
  }

  verifyResetToken(token: string) {
    return this.http.get<{
      valid: boolean;
      email?: string;
      expiresAt?: string;
    }>(`${this.base}/auth/verify-reset-token/${token}`);
  }

  resetPassword(token: string, newPassword: string) {
    return this.http.post<{
      success: boolean;
      message: string;
    }>(`${this.base}/auth/reset-password`, { token, newPassword });
  }

  // Refresh Token
  refreshToken(refreshToken: string) {
    return this.http.post<{
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    }>(`${this.base}/auth/refresh`, { refreshToken });
  }

  // Stripe Payments
  getPricing() {
    return this.http.get<{
      subscriptions: {
        [key: string]: {
          name: string;
          price: number;
          currency: string;
          interval: string;
          features: string[];
        };
      };
      temporarySessions: {
        [key: string]: {
          name: string;
          price: number;
          currency: string;
          duration: string;
          features: string[];
        };
      };
    }>(`${this.base}/payments/pricing`);
  }

  createSubscriptionCheckout(plan: string, successUrl: string, cancelUrl: string) {
    return this.http.post<{
      checkoutUrl: string;
      sessionId: string;
    }>(`${this.base}/payments/checkout/subscription`, { plan, successUrl, cancelUrl });
  }

  createSessionCheckout(sessionType: string, sessionName: string, successUrl: string, cancelUrl: string) {
    return this.http.post<{
      checkoutUrl: string;
      sessionId: string;
      tenantSessionId: string;
    }>(`${this.base}/payments/checkout/session`, { sessionType, sessionName, successUrl, cancelUrl });
  }

  getCheckoutSession(sessionId: string) {
    return this.http.get<{
      id: string;
      status: string;
      paymentStatus: string;
      amountTotal: number;
      currency: string;
      customerEmail: string;
      customerName: string;
      metadata: any;
      lineItems: Array<{
        description: string;
        amount: number;
        currency: string;
      }>;
      createdAt: string;
    }>(`${this.base}/payments/checkout/${sessionId}`);
  }

  createCustomerPortal(returnUrl: string) {
    return this.http.post<{
      portalUrl: string;
    }>(`${this.base}/payments/portal`, { returnUrl });
  }

  getPaymentHistory() {
    return this.http.get<{
      payments: Array<{
        id: string;
        type: string;
        status: string;
        amount: number;
        currency: string;
        description: string;
        createdAt: string;
        paidAt: string | null;
      }>;
    }>(`${this.base}/payments/history`);
  }

  getPaymentStatus() {
    return this.http.get<{
      subscription: {
        plan: string;
        status: string;
        expiresAt: string | null;
        isActive: boolean;
      };
      limits: {
        maxEvents: number;
        maxPlayersPerEvent: number;
        maxUsers: number;
      };
      usage: any;
      hasActiveSession: boolean;
      canCreateEvent: boolean;
    }>(`${this.base}/payments/status`);
  }

  getActiveSessions() {
    return this.http.get<{
      sessions: Array<{
        id: string;
        name: string;
        description: string;
        durationDays: number;
        startsAt: string;
        expiresAt: string;
        isActive: boolean;
        daysRemaining: number;
        usage: any;
        limits: {
          maxEvents: number;
          maxPlayersPerEvent: number;
          maxTotalPlayers: number;
        };
      }>;
    }>(`${this.base}/payments/sessions`);
  }

  cancelSubscription() {
    return this.http.post<{
      message: string;
    }>(`${this.base}/payments/subscription/cancel`, {});
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

  // Events Management
  getEvents() {
    return this.http
      .get<{
        events: Array<{
          id: string;
          code: string;
          name: string;
          gameMode: 'TEAM' | 'SOLO';
          created_at: string;
          status: string;
          rounds_count: number;
          teams_count: number;
        }>;
      }>(`${this.base}/events`)
      .pipe(map((response) => response.events));
  }
}
