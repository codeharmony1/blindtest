import { Component, ViewEncapsulation, ViewChild, ElementRef } from '@angular/core';
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
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  eventCode!: string;
  rounds: Array<{ id: string; name: string | null }> = [];
  roundId: string = '';
  duration = 15;

  currentSongId: string | null = null;
  officialTitle = '';
  officialArtist = '';

  // Création de chanson
  songs: Array<{
    id: string;
    idx: number;
    title: string | null;
    artist: string | null;
    status: string;
    startedAt?: Date;
    endedAt?: Date;
  }> = [];
  newSongTitle = '';
  newSongArtist = '';
  showCreateSong = false;

  // Création de round
  showCreateRound = false;
  newRoundName = '';
  newRoundDuration = 15;
  newRoundTotalSongs = 20;

  // Intervalle pour le compte à rebours
  private countdownInterval: any;

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
      this.loadSongs(); // Recharger pour avoir les timestamps
    });

    // Démarrer le compte à rebours
    this.countdownInterval = setInterval(() => {
      // Vérifier si une chanson ouverte a atteint la fin du compte à rebours
      this.checkExpiredSongs();
    }, 1000);
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
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
      if (!this.roundId && list.length) {
        this.roundId = list[0].id;
        this.loadSongs();
      }
    });
  }

  loadSongs() {
    if (!this.roundId) return;
    this.api.getRoundSongs(this.roundId).subscribe({
      next: (songs) => {
        this.songs = songs;
        console.log('[DJ] Chansons chargées:', songs.map(s => ({ id: s.id, title: s.title, status: s.status })));
      },
      error: (err) => {
        console.warn('[DJ] Erreur chargement chansons:', err);
        this.songs = [];
      },
    });
  }

  onRoundChange() {
    this.loadSongs();
  }

  toggleCreateSong() {
    this.showCreateSong = !this.showCreateSong;
    if (this.showCreateSong) {
      this.newSongTitle = '';
      this.newSongArtist = '';
    }
  }

  createSong() {
    if (!this.roundId) {
      alert('⚠️ Veuillez sélectionner un round');
      return;
    }
    if (!this.newSongTitle.trim()) {
      alert('⚠️ Veuillez entrer un titre');
      return;
    }

    const nextIdx = this.songs.length > 0 ? Math.max(...this.songs.map((s) => s.idx)) + 1 : 1;

    this.api
      .createSong(this.roundId, {
        mode: 'freestyle',
        idx: nextIdx,
        title: this.newSongTitle.trim(),
        artist: this.newSongArtist.trim() || undefined,
        duration: this.duration,
      })
      .subscribe({
        next: (response) => {
          console.log('[DJ] Chanson créée:', response);
          alert(`✅ Chanson "${this.newSongTitle}" créée !`);
          this.newSongTitle = '';
          this.newSongArtist = '';
          this.showCreateSong = false;
          this.loadSongs(); // Recharger la liste
        },
        error: (err) => {
          console.error('[DJ] Erreur création chanson:', err);
          if (err.status === 403 && err.error?.code === 'SONG_LIMIT_REACHED') {
            alert(
              `❌ ${err.error.message}\n\nLimite : ${err.error.limit} chansons\nActuel : ${err.error.current}`,
            );
          } else {
            alert(`❌ Erreur: ${err.error?.message || err.message || 'Erreur inconnue'}`);
          }
        },
      });
  }

  next() {
    if (!this.roundId) {
      alert('⚠️ Veuillez sélectionner un round');
      return;
    }

    // Vérifier qu'il y a des chansons dans le round
    if (this.songs.length === 0) {
      alert('⚠️ Aucune chanson dans ce round.\n\nAjoutez des chansons avant de commencer.');
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
          this.currentSongId = response.nextSongId;
          this.loadSongs(); // Recharger pour mettre à jour les statuts
          alert(`✅ Chanson lancée !`);
        } else {
          console.warn('⚠️ Aucune chanson suivante disponible');
          alert('⚠️ Toutes les chansons ont été jouées.\n\nLe round est terminé !');
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

  launchSong(songId: string) {
    console.log('[DJ] Lancement direct de la chanson:', songId);

    // Trouver la chanson dans la liste pour vérifier son statut
    const song = this.songs.find((s) => s.id === songId);

    if (!song) {
      alert('❌ Chanson non trouvée');
      return;
    }

    // Si la chanson est déjà ouverte, la définir simplement comme courante
    if (song.status === 'open') {
      console.log('[DJ] Chanson déjà ouverte, définition comme courante');
      this.currentSongId = songId;
      return;
    }

    // Si la chanson est fermée ou notée, informer l'utilisateur
    if (song.status === 'closed' || song.status === 'scored') {
      alert(`⚠️ Cette chanson est déjà ${song.status === 'closed' ? 'fermée' : 'notée'}.\n\nUtilisez le bouton "SUIVANT" pour passer à la prochaine chanson.`);
      this.currentSongId = songId;
      return;
    }

    // Sinon, ouvrir la chanson (statut: pending)
    this.api.openSong(songId, this.duration).subscribe({
      next: () => {
        console.log('✅ Chanson lancée:', songId);
        this.currentSongId = songId;
        this.loadSongs(); // Recharger pour mettre à jour les statuts
      },
      error: (err) => {
        if (err.status === 409) {
          console.warn('[DJ] Chanson déjà ouverte');
          this.currentSongId = songId;
          this.loadSongs();
        } else if (err.status === 404) {
          console.warn('[DJ] Chanson non trouvée');
          alert('❌ Chanson non trouvée');
        } else {
          console.warn('[DJ] Erreur lancement:', err.status || 'inconnue');
          alert(`❌ Erreur: ${err.error?.message || err.message || 'Erreur inconnue'}`);
        }
      },
    });
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending':
        return '⏸️ En attente';
      case 'open':
        return '▶️ En cours';
      case 'closed':
        return '⏹️ Fermée';
      case 'scored':
        return '✅ Notée';
      default:
        return status;
    }
  }

  // Actions rapides sur les chansons
  openSongDirect(songId: string) {
    this.api.openSong(songId, this.duration).subscribe({
      next: () => {
        console.log('[DJ] Chanson ouverte:', songId);
        this.currentSongId = songId;
        this.loadSongs();
      },
      error: (err) => {
        console.error('[DJ] Erreur ouverture:', err);
        if (err.status === 409) {
          this.currentSongId = songId;
          this.loadSongs();
        }
      },
    });
  }

  closeSongDirect(songId: string) {
    this.api.closeSong(songId).subscribe({
      next: () => {
        console.log('[DJ] Chanson fermée:', songId);
        this.loadSongs();
      },
      error: (err) => {
        console.error('[DJ] Erreur fermeture:', err);
        if (err.status === 409) {
          this.loadSongs();
        }
      },
    });
  }

  gradeSongDirect(songId: string) {
    this.api.gradeSong(songId, {}).subscribe({
      next: () => {
        console.log('[DJ] Chanson notée:', songId);
        this.loadSongs();
      },
      error: (err) => {
        console.error('[DJ] Erreur notation:', err);
        if (err.status === 409) {
          this.loadSongs();
        }
      },
    });
  }

  changeStatus(songId: string, newStatus: string) {
    this.api.patchSong(songId, { status: newStatus }).subscribe({
      next: () => {
        console.log(`[DJ] Statut changé: ${songId} -> ${newStatus}`);
        this.loadSongs();
      },
      error: (err) => {
        console.error('[DJ] Erreur changement statut:', err);
        alert(`❌ Erreur: ${err.error?.message || err.message || 'Erreur inconnue'}`);
      },
    });
  }

  getCountdown(song: any): string {
    if (song.status !== 'open' || !song.endedAt) {
      return '';
    }

    const endTime = new Date(song.endedAt).getTime();
    const now = Date.now();
    const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

    if (remaining === 0) {
      return '⏱️ Terminé';
    }

    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;

    if (minutes > 0) {
      return `⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return `⏱️ ${seconds}s`;
  }

  getCountdownClass(song: any): string {
    if (song.status !== 'open' || !song.endedAt) {
      return '';
    }

    const endTime = new Date(song.endedAt).getTime();
    const now = Date.now();
    const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

    if (remaining === 0) return 'expired';
    if (remaining <= 5) return 'critical';
    if (remaining <= 10) return 'warning';
    return 'normal';
  }

  // Vérifier et fermer automatiquement les chansons dont le temps est écoulé
  private checkExpiredSongs() {
    const now = Date.now();

    this.songs.forEach(song => {
      if (song.status === 'open' && song.endedAt) {
        const endTime = new Date(song.endedAt).getTime();
        const remaining = endTime - now;

        // Si le temps est écoulé (avec une marge de 1 seconde pour éviter les problèmes de timing)
        if (remaining <= 0) {
          console.log(`[DJ] Chanson ${song.id} expirée, fermeture automatique...`);
          this.closeSongDirect(song.id);
        }
      }
    });
  }

  // Gestion création de round
  toggleCreateRound() {
    this.showCreateRound = !this.showCreateRound;
    if (this.showCreateRound) {
      this.newRoundName = '';
      this.newRoundDuration = 15;
      this.newRoundTotalSongs = 20;
    }
  }

  createRound() {
    if (!this.newRoundName.trim()) {
      alert('⚠️ Veuillez entrer un nom pour le round');
      return;
    }

    this.api.createRound(this.eventCode, {
      name: this.newRoundName.trim(),
      defaultDuration: this.newRoundDuration,
      totalSongs: this.newRoundTotalSongs
    }).subscribe({
      next: (response) => {
        console.log('[DJ] Round créé:', response);
        alert(`✅ Round "${this.newRoundName}" créé !`);
        this.newRoundName = '';
        this.newRoundDuration = 15;
        this.newRoundTotalSongs = 20;
        this.showCreateRound = false;
        this.loadRounds(); // Recharger la liste des rounds
        this.roundId = response.id; // Sélectionner automatiquement le nouveau round
      },
      error: (err) => {
        console.error('[DJ] Erreur création round:', err);
        alert(`❌ Erreur: ${err.error?.message || err.message || 'Erreur inconnue'}`);
      }
    });
  }

  // Gestion import CSV
  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    if (!file.name.endsWith('.csv')) {
      alert('⚠️ Veuillez sélectionner un fichier CSV');
      return;
    }

    if (!this.roundId) {
      alert('⚠️ Veuillez sélectionner un round avant d\'importer');
      return;
    }

    const confirmed = confirm(
      `📂 Import CSV\n\n` +
      `Fichier : ${file.name}\n` +
      `Taille : ${(file.size / 1024).toFixed(2)} KB\n\n` +
      `Format attendu :\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `• Séparateur : virgule (,)\n` +
      `• Encodage : UTF-8\n` +
      `• Première ligne : en-têtes de colonnes\n\n` +
      `Colonnes :\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `✓ title (obligatoire) - Titre de la chanson\n` +
      `✓ singer (obligatoire) - Nom du chanteur\n` +
      `✓ band (obligatoire) - Nom du groupe\n` +
      `○ aliases (optionnel) - Titres alternatifs (séparés par |)\n\n` +
      `Exemple :\n` +
      `title,singer,band,aliases\n` +
      `Bohemian Rhapsody,Freddie Mercury,Queen,Bohem|BR\n` +
      `Let It Be,Paul McCartney,The Beatles,\n\n` +
      `Continuer l'import ?`
    );

    if (!confirmed) {
      input.value = ''; // Reset input
      return;
    }

    const formData = new FormData();
    formData.append('csv', file);

    console.log('[DJ] Import CSV en cours...', file.name);

    this.api.importPlaylistCSV(this.roundId, formData).subscribe({
      next: (response) => {
        console.log('[DJ] Import réussi:', response);
        alert(
          `✅ Import réussi !\n\n` +
          `${response.imported} chanson(s) importée(s)\n\n` +
          `Les chansons ont été ajoutées au round.`
        );
        this.loadSongs(); // Recharger la liste des chansons
        input.value = ''; // Reset input
      },
      error: (err) => {
        console.error('[DJ] Erreur import CSV:', err);
        let errorMessage = 'Erreur inconnue';

        if (err.status === 403 && err.error?.code === 'SONG_LIMIT_REACHED') {
          errorMessage = err.error.message;
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        } else if (err.message) {
          errorMessage = err.message;
        }

        alert(`❌ Erreur d'import :\n\n${errorMessage}`);
        input.value = ''; // Reset input
      }
    });
  }

  // Supprimer une chanson
  deleteSong(songId: string, event: Event) {
    event.stopPropagation();

    const confirmed = confirm(
      '🗑️ Supprimer cette chanson ?\n\n' +
      'Cette action est irréversible.\n\n' +
      'Continuer ?'
    );

    if (!confirmed) {
      return;
    }

    console.log('[DJ] Suppression de la chanson:', songId);

    this.api.deleteSong(songId).subscribe({
      next: (response) => {
        console.log('[DJ] Chanson supprimée:', response);
        alert('✅ Chanson supprimée avec succès');
        this.loadSongs(); // Recharger la liste
      },
      error: (err) => {
        console.error('[DJ] Erreur suppression chanson:', err);
        const errorMessage = err.error?.message || err.message || 'Erreur inconnue';
        alert(`❌ Erreur de suppression :\n\n${errorMessage}`);
      }
    });
  }
}
