import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { SocketService } from '../../core/services/socket.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'bt-live-control',
  standalone: true,
  imports: [CommonModule, FormsModule],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './live-control-ultra.component.html',
  styleUrls: ['./dj-ultra-modern.scss'],
})
export class LiveControlComponent {
  eventCode!: string;
  rounds: Array<{ id: string; name: string | null }> = [];
  roundId: string = '';
  duration = 15;

  currentSongId: string | null = null;
  officialTitle = '';
  officialArtist = '';

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private socket: SocketService,
    private theme: ThemeService,
  ) {
    this.eventCode = this.route.snapshot.params['eventCode'];
    // Appliquer le thème de l'événement sur l'interface DJ
    this.theme.loadEventTheme(this.eventCode).subscribe();
    this.loadRounds();
    this.socket.connect();
    this.socket.joinEvent(this.eventCode, 'DJ');
    this.socket.on<any>('round_started', (d) => {
      this.currentSongId = String(d.songId);
    });
  }

  toggleAmbient() {
    const key = 'bt_enable_ambient';
    const current = localStorage.getItem(key);
    const enabled = current !== 'false';
    // Toggle
    localStorage.setItem(key, enabled ? 'false' : 'true');
    // Forcer un re-render du calque: recharger le thème courant
    const t = this.theme.getCurrentTheme();
    if (t) this.theme.applyTheme(t);
  }

  loadRounds() {
    this.api.getRounds(this.eventCode).subscribe((list) => {
      this.rounds = list;
      if (!this.roundId && list.length) this.roundId = list[0].id;
    });
  }

  next() {
    if (!this.roundId) {
      alert('⚠️ Veuillez sélectionner un round');
      return;
    }
    console.log(
      `[DJ] Tentative de passage au suivant - Round: ${this.roundId}, Durée: ${this.duration}s`,
    );

    this.api.nextSong(this.roundId, this.duration).subscribe({
      next: (response) => {
        console.log('[DJ] Réponse API:', response);
        if (response.nextSongId) {
          console.log(`✅ Chanson suivante activée: ${response.nextSongId}`);
          alert(`✅ Chanson ${response.nextSongId} activée !`);
        } else {
          console.warn('⚠️ Aucune chanson suivante disponible');
          alert(
            '⚠️ Aucune chanson suivante disponible dans ce round.\n\nVérifiez que le round contient des chansons.',
          );
        }
      },
      error: (err) => {
        console.error('[DJ] Erreur complète:', err);
        if (err.status === 409) {
          alert('⚠️ Opération déjà effectuée');
        } else if (err.status === 404) {
          alert('❌ Round non trouvé');
        } else {
          alert(`❌ Erreur: ${err.error?.message || err.message || 'Erreur inconnue'}`);
        }
      },
    });
  }
  open() {
    if (!this.currentSongId) return;
    this.api.openSong(this.currentSongId, this.duration).subscribe({
      next: () => {
        console.log('Chanson ouverte');
      },
      error: (err) => {
        if (err.status === 409) {
          console.warn('[DJ] Ouverture: Chanson déjà ouverte');
        } else if (err.status === 404) {
          console.warn('[DJ] Ouverture: Chanson non trouvée');
        } else {
          console.warn('[DJ] Ouverture: Erreur', err.status || 'inconnue');
        }
      },
    });
  }
  close() {
    if (!this.currentSongId) return;
    this.api.closeSong(this.currentSongId).subscribe({
      next: () => {
        console.log('Chanson fermée');
      },
      error: (err) => {
        if (err.status === 409) {
          console.warn('[DJ] Fermeture: Chanson déjà fermée');
        } else if (err.status === 404) {
          console.warn('[DJ] Fermeture: Chanson non trouvée');
        } else {
          console.warn('[DJ] Fermeture: Erreur', err.status || 'inconnue');
        }
      },
    });
  }
  grade() {
    if (!this.currentSongId) return;
    this.api.gradeSong(this.currentSongId, this.buildOfficialPayload()).subscribe({
      next: () => {
        console.log('Chanson notée');
      },
      error: (err) => {
        if (err.status === 409) {
          console.warn('[DJ] Notation: Chanson déjà notée');
        } else if (err.status === 404) {
          console.warn('[DJ] Notation: Chanson non trouvée');
        } else {
          console.warn('[DJ] Notation: Erreur', err.status || 'inconnue');
        }
      },
    });
  }
  saveOfficial() {
    if (!this.currentSongId) return;
    this.api.patchSong(this.currentSongId, this.buildOfficialPayload()).subscribe({
      next: () => {
        console.log('Sauvegarde officielle effectuée');
      },
      error: (err) => {
        if (err.status === 404) {
          console.warn('[DJ] Sauvegarde: Chanson non trouvée');
        } else {
          console.warn('[DJ] Sauvegarde: Erreur', err.status || 'inconnue');
        }
      },
    });
  }
  private buildOfficialPayload() {
    const p: any = {};
    if (this.officialTitle.trim()) p.title = this.officialTitle.trim();
    if (this.officialArtist.trim()) p.artist = this.officialArtist.trim();
    return p;
  }
}
