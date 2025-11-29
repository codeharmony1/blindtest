import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Event {
  id: string;
  code: string;
  name: string;
  gameMode?: 'TEAM' | 'SOLO';
  tableMode?: boolean;
  created_at: string;
  rounds_count?: number;
  teams_count?: number;
  status: 'active' | 'inactive' | 'completed';
  // Nouveaux champs lifecycle
  startDate?: string; // ISO 8601 date string
  endDate?: string; // ISO 8601 date string
  actualStartDate?: string;
  codeExpiresAt?: string;
}

export interface Table {
  id: string;
  name: string;
  teamsCount: number;
  createdAt: string;
}

export interface TableWithTeams {
  tableId: string;
  tableName: string;
  teams: Array<{
    id: string;
    name: string;
    playersCount: number;
    manualParticipantsCount: number;
  }>;
}

export interface TableScore {
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
}

export interface CreateEventRequest {
  organizerId?: string; // Optionnel pour multi-tenant
  name: string;
  code?: string;
  gameMode?: 'TEAM' | 'SOLO';
  tableMode?: boolean;
  settings?: any;
  // Nouveaux champs lifecycle
  startDate?: string; // ISO 8601 date string
  endDate?: string;
}

export interface CreateEventResponse {
  id: string;
  code: string;
  name: string;
  createdAt: string;
}

export interface EventByIdResponse {
  id: string;
  code: string;
  name: string;
  gameMode?: 'TEAM' | 'SOLO';
  tableMode?: boolean;
  createdAt: string;
}

export interface UpdateEventRequest {
  name?: string;
  gameMode?: 'TEAM' | 'SOLO';
  tableMode?: boolean;
  settings?: any;
}

export interface UpdateEventResponse {
  id: string;
  code: string;
  name: string;
  createdAt: string;
  updated: boolean;
}

export interface ReactivateEventRequest {
  startDate: string; // ISO 8601 date string
  endDate: string;
}

export interface ReactivateEventResponse {
  id: string;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  codeExpiresAt: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED';
  codeChanged: boolean;
  previousCode?: string;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private readonly API_BASE = '/api';

  private eventsSubject = new BehaviorSubject<Event[]>([]);
  public events$ = this.eventsSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Get all events for the current tenant/organizer
  getEvents(): Observable<{ events: Event[] }> {
    // Dans le système multi-tenant, le tenantId est extrait du token automatiquement
    // L'interceptor ajoute le token JWT qui contient tenantId
    return this.http
      .get<{ events: Event[] }>(`${this.API_BASE}/events`)
      .pipe(
        tap((response) => {
          this.eventsSubject.next(response.events);
        }),
      );
  }

  // Create a new event
  createEvent(eventData: Omit<CreateEventRequest, 'organizerId'>): Observable<CreateEventResponse> {
    // Dans le système multi-tenant, le tenantId est extrait du token automatiquement
    // Pas besoin d'envoyer organizerId
    return this.http.post<CreateEventResponse>(`${this.API_BASE}/events`, eventData).pipe(
      tap(() => {
        // Refresh the events list after creating a new event
        this.getEvents().subscribe();
      }),
    );
  }

  // Get event by ID
  getEventById(id: string): Observable<EventByIdResponse> {
    return this.http.get<EventByIdResponse>(`${this.API_BASE}/events/id/${id}`);
  }

  // Update event by ID
  updateEvent(id: string, data: UpdateEventRequest): Observable<UpdateEventResponse> {
    return this.http.put<UpdateEventResponse>(`${this.API_BASE}/events/id/${id}`, data).pipe(
      tap(() => {
        // Refresh events list after update
        this.getEvents().subscribe();
      }),
    );
  }

  // Get event by code
  getEventByCode(code: string): Observable<Event> {
    return this.http.get<Event>(`${this.API_BASE}/events/${code}`);
  }

  // Get current events (synchronous access to the cached list)
  getCurrentEvents(): Event[] {
    return this.eventsSubject.value;
  }

  // Duplicate an event with all its rounds and songs
  duplicateEvent(eventId: string, newName?: string): Observable<{
    id: string;
    code: string;
    name: string;
    gameMode: 'TEAM' | 'SOLO';
    createdAt: string;
    originalEventId: string;
    roundsCount: number;
  }> {
    return this.http.post<{
      id: string;
      code: string;
      name: string;
      gameMode: 'TEAM' | 'SOLO';
      createdAt: string;
      originalEventId: string;
      roundsCount: number;
    }>(`${this.API_BASE}/events/${eventId}/duplicate`, { name: newName }).pipe(
      tap(() => {
        // Refresh the events list after duplication
        this.getEvents().subscribe();
      }),
    );
  }

  /**
   * Régénérer le code PIN DJ pour un événement
   */
  regenerateDjPin(eventId: string): Observable<{
    success: boolean;
    message: string;
    djPin: string;
    eventCode: string;
    eventName: string;
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      djPin: string;
      eventCode: string;
      eventName: string;
    }>(`${this.API_BASE}/events/${eventId}/regenerate-dj-pin`, {});
  }

  /**
   * Réactiver un événement avec nouvelles dates
   */
  reactivateEvent(
    eventId: string,
    data: ReactivateEventRequest
  ): Observable<ReactivateEventResponse> {
    return this.http
      .post<ReactivateEventResponse>(
        `${this.API_BASE}/events/${eventId}/reactivate`,
        data
      )
      .pipe(
        tap(() => {
          // Refresh the events list after reactivation
          this.getEvents().subscribe();
        })
      );
  }

  /**
   * Supprimer un événement
   */
  deleteEvent(eventId: string): Observable<{ success: boolean; message: string }> {
    return this.http
      .delete<{ success: boolean; message: string }>(
        `${this.API_BASE}/events/${eventId}`
      )
      .pipe(
        tap(() => {
          // Refresh the events list after deletion
          this.getEvents().subscribe();
        })
      );
  }
}
