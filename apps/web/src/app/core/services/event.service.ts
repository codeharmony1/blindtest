import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Event {
  id: string;
  code: string;
  name: string;
  created_at: string;
  rounds_count?: number;
  teams_count?: number;
  status: 'active' | 'inactive' | 'completed';
}

export interface CreateEventRequest {
  organizerId: string;
  name: string;
  code?: string;
  settings?: any;
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
  createdAt: string;
}

export interface UpdateEventRequest {
  name?: string;
  settings?: any;
}

export interface UpdateEventResponse {
  id: string;
  code: string;
  name: string;
  createdAt: string;
  updated: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private readonly API_BASE = 'http://localhost:3000/api';
  private readonly TEST_ORGANIZER_ID = '3'; // ID of test organizer

  private eventsSubject = new BehaviorSubject<Event[]>([]);
  public events$ = this.eventsSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Get all events for the current organizer
  getEvents(): Observable<{ events: Event[] }> {
    return this.http
      .get<{ events: Event[] }>(`${this.API_BASE}/events`, {
        params: { organizerId: this.TEST_ORGANIZER_ID },
      })
      .pipe(
        tap((response) => {
          this.eventsSubject.next(response.events);
        }),
      );
  }

  // Create a new event
  createEvent(eventData: Omit<CreateEventRequest, 'organizerId'>): Observable<CreateEventResponse> {
    const payload: CreateEventRequest = {
      ...eventData,
      organizerId: this.TEST_ORGANIZER_ID,
    };

    return this.http.post<CreateEventResponse>(`${this.API_BASE}/events`, payload).pipe(
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
}
