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
  newSongGroup = '';
  showCreateSong = false;

  // Création de round
  showCreateRound = false;
  newRoundName = '';

  // Gestion des participants et tables (panneau unifié)
  showHierarchy = false; // Panneau unifié Tables > Teams > Players
  tableMode = false;

  // Structure hiérarchique unifiée
  hierarchyData: Array<{
    id: string;
    name: string;
    teamsCount: number;
    teams?: Array<{
      id: string;
      name: string;
      playersCount: number;
      players?: Array<{
        id: string;
        nickname: string;
        isCaptain: boolean;
        createdAt: string;
      }>;
    }>;
  }> = [];

  // Données brutes pour mode sans tables
  players: Array<{
    id: string;
    nickname: string;
    teamId: string;
    teamName: string;
    isCaptain: boolean;
    createdAt: string;
  }> = [];

  // Gestion limite DEMO
  showLimitModal = false;
  limitModalData: {
    message: string;
    limit: number;
    current: number;
  } | null = null;

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

    // Vérifier si le mode table est activé
    this.api.getEventPublic(this.eventCode).subscribe((event) => {
      this.tableMode = event.settings?.tableMode || false;
      if (this.tableMode) {
        this.loadHierarchy();
      }
    });

    this.loadRounds();
    this.socket.connect();
    this.socket.joinEvent(this.eventCode, 'DJ');
    this.socket.on<any>('round_started', (d) => {
      this.currentSongId = String(d.songId);
      this.loadSongs(); // Recharger pour avoir les timestamps
    });

    // Écouter les événements de table
    this.socket.on<any>('table_created', () => {
      if (this.tableMode) this.loadHierarchy();
    });
    this.socket.on<any>('team_joined_table', () => {
      if (this.tableMode) this.loadHierarchy();
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
    console.log('[DJ] Round sélectionné, roundId:', this.roundId);
    this.loadSongs();
  }

  toggleCreateSong() {
    this.showCreateSong = !this.showCreateSong;
    if (this.showCreateSong) {
      this.newSongTitle = '';
      this.newSongArtist = '';
      this.newSongGroup = '';
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
        group: this.newSongGroup.trim() || undefined,
        duration: this.duration,
      })
      .subscribe({
        next: (response) => {
          console.log('[DJ] Chanson créée:', response);
          this.newSongTitle = '';
          this.newSongArtist = '';
          this.newSongGroup = '';
          this.showCreateSong = false;
          this.loadSongs(); // Recharger la liste
        },
        error: (err) => {
          // L'erreur peut être dans err.error.error (structure Angular HttpErrorResponse)
          const errorData = err.error?.error || err.error;

          if (err.status === 403 && errorData?.code === 'SONG_LIMIT_REACHED') {
            // Afficher le modal de limite atteinte
            this.limitModalData = {
              message: errorData.message,
              limit: errorData.limit,
              current: errorData.current
            };
            this.showLimitModal = true;
          } else {
            console.error('[DJ] Erreur création chanson:', err);
            alert(`❌ Erreur: ${errorData?.message || err.message || 'Erreur inconnue'}`);
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
          // Pas de notification - l'interface visuelle se met à jour automatiquement
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
        console.log('Chanson fermée - La notation est automatique');
        this.loadSongs(); // Recharger pour voir le statut automatiquement changé en "scored"
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

  // Méthode grade() supprimée - la notation est automatique côté serveur

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
        return '✅ Noté (auto)'; // Affichage pour info mais pas modifiable
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
        console.log('[DJ] Chanson fermée (notation automatique):', songId);
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

  // Méthode gradeSongDirect() supprimée - la notation est automatique côté serveur

  showRoundScores() {
    if (!this.roundId) {
      alert('Veuillez sélectionner un round');
      return;
    }

    this.api.getRoundScores(this.eventCode, this.roundId).subscribe({
      next: (data) => {
        console.log('[DJ] Affichage des scores du round:', data);

        // Déterminer si c'est le dernier round en comparant l'ID du round actuel avec celui du dernier round de la liste
        const lastRound = this.rounds[this.rounds.length - 1];
        const isLastRound = lastRound && this.roundId === lastRound.id;

        console.log('[DJ] === DÉTECTION DERNIER ROUND ===');
        console.log('[DJ] roundId actuel:', this.roundId);
        console.log('[DJ] dernier round ID:', lastRound?.id);
        console.log('[DJ] nombre total de rounds:', this.rounds.length);
        console.log('[DJ] isLastRound:', isLastRound);

        // Émettre l'événement socket pour afficher les scores sur le rétroprojecteur
        this.socket.emit('round_scores_ready', {
          eventCode: this.eventCode,
          roundNumber: data.roundNumber,
          roundScores: data.roundScores,
          isLastRound: isLastRound,
        });

        if (isLastRound) {
          alert(`🏆 Podium final de la manche ${data.roundNumber} affiché sur le rétroprojecteur !`);
        } else {
          alert(`✅ Scores de la manche ${data.roundNumber} affichés sur le rétroprojecteur`);
        }
      },
      error: (err) => {
        console.error('[DJ] Erreur récupération scores:', err);
        alert(`❌ Erreur: ${err.error?.error?.code || err.message || 'Erreur inconnue'}`);
      },
    });
  }

  completeEvent() {
    const confirmed = confirm('⚠️ Voulez-vous vraiment marquer cet événement comme terminé ? Cela affichera le podium final aux joueurs.');
    if (!confirmed) return;

    this.api.completeEvent(this.eventCode).subscribe({
      next: (response) => {
        console.log('[DJ] Événement marqué comme terminé:', response);
        alert('🏆 L\'événement a été marqué comme terminé ! Le podium final s\'affiche maintenant aux joueurs.');
      },
      error: (err) => {
        console.error('[DJ] Erreur complétion événement:', err);
        alert(`❌ Erreur: ${err.error?.error?.message || err.message || 'Erreur inconnue'}`);
      }
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
    }
  }

  createRound() {
    if (!this.newRoundName.trim()) {
      alert('⚠️ Veuillez entrer un nom pour le round');
      return;
    }

    this.api.createRound(this.eventCode, {
      name: this.newRoundName.trim(),
      defaultDuration: 15, // Valeur par défaut fixe (non modifiable par l'UI)
      totalSongs: 20 // Valeur par défaut, non modifiable par l'utilisateur
    }).subscribe({
      next: (response) => {
        console.log('[DJ] Round créé:', response);
        // Pas de notification - comportement silencieux
        this.newRoundName = '';
        this.showCreateRound = false;
        this.loadRounds(); // Recharger la liste des rounds
        this.roundId = response.id; // Sélectionner automatiquement le nouveau round
        this.loadSongs(); // Charger la liste (vide) des chansons du nouveau round
      },
      error: (err) => {
        console.error('[DJ] Erreur création round:', err);
        alert(`❌ Erreur: ${err.error?.message || err.message || 'Erreur inconnue'}`);
      }
    });
  }

  deleteCurrentRound() {
    if (!this.roundId) {
      alert('⚠️ Veuillez sélectionner un round à supprimer');
      return;
    }

    const round = this.rounds.find(r => r.id === this.roundId);
    const roundName = round?.name || `Round ${this.roundId}`;

    const confirmed = confirm(
      `🗑️ Supprimer le round "${roundName}" ?\n\n` +
      'Cette action supprimera également toutes les chansons de ce round.\n' +
      'Cette action est irréversible.\n\n' +
      'Continuer ?'
    );

    if (!confirmed) {
      return;
    }

    console.log('[DJ] Suppression du round:', this.roundId);

    this.api.deleteRound(this.roundId).subscribe({
      next: () => {
        console.log('[DJ] Round supprimé:', roundName);
        alert(`✅ Round "${roundName}" supprimé avec succès`);

        // Réinitialiser la sélection
        this.roundId = '';
        this.songs = [];

        this.loadRounds(); // Recharger la liste des rounds
      },
      error: (err) => {
        console.error('[DJ] Erreur suppression round:', err);
        const errorMessage = err.error?.message || err.message || 'Erreur inconnue';
        alert(`❌ Erreur de suppression :\n\n${errorMessage}`);
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
        // L'erreur peut être dans err.error.error (structure Angular HttpErrorResponse)
        const errorData = err.error?.error || err.error;

        if (err.status === 403 && errorData?.code === 'SONG_LIMIT_REACHED') {
          // Afficher le modal de limite atteinte
          this.limitModalData = {
            message: errorData.message,
            limit: errorData.limit,
            current: errorData.current
          };
          this.showLimitModal = true;
        } else {
          console.error('[DJ] Erreur import CSV:', err);
          let errorMessage = 'Erreur inconnue';
          if (errorData?.message) {
            errorMessage = errorData.message;
          } else if (err.message) {
            errorMessage = err.message;
          }
          alert(`❌ Erreur d'import :\n\n${errorMessage}`);
        }

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

  // Gestion du panneau hiérarchique unifié
  toggleHierarchy() {
    this.showHierarchy = !this.showHierarchy;
    if (this.showHierarchy) {
      this.loadHierarchy();
    }
  }

  loadHierarchy() {
    if (this.tableMode) {
      // Mode tables : charger la hiérarchie Tables > Teams > Players
      this.api.getTables(this.eventCode).subscribe({
        next: (tables) => {
          this.hierarchyData = tables;
          console.log('[DJ] Tables chargées:', tables.length);

          // Charger les équipes et joueurs pour chaque table
          tables.forEach(table => {
            this.api.getTableTeams(table.id).subscribe({
              next: (data) => {
                const tableIndex = this.hierarchyData.findIndex(t => t.id === table.id);
                if (tableIndex !== -1) {
                  this.hierarchyData[tableIndex].teams = data.teams.map(team => ({
                    ...team,
                    players: [] // Sera chargé à la demande
                  }));
                }
              },
              error: (err) => {
                console.error('[DJ] Erreur chargement équipes table:', err);
              }
            });
          });
        },
        error: (err) => {
          console.error('[DJ] Erreur chargement tables:', err);
          alert(`❌ Erreur: ${err.error?.message || err.message || 'Erreur inconnue'}`);
        }
      });
    } else {
      // Mode sans tables : charger directement les joueurs groupés par équipe
      this.loadPlayers();
    }
  }

  loadPlayers() {
    this.api.getPlayers(this.eventCode).subscribe({
      next: (players) => {
        this.players = players;
        console.log('[DJ] Participants chargés:', players.length);

        // Construire la hiérarchie Teams > Players (sans tables)
        const teamMap = new Map<string, any>();

        players.forEach(player => {
          const teamId = player.teamId;
          const teamName = player.teamName || `Équipe ${teamId}`;

          if (!teamMap.has(teamId)) {
            teamMap.set(teamId, {
              id: teamId,
              name: teamName,
              playersCount: 0,
              players: []
            });
          }

          const team = teamMap.get(teamId);
          team.players.push({
            id: player.id,
            nickname: player.nickname,
            isCaptain: player.isCaptain,
            createdAt: player.createdAt
          });
          team.playersCount++;
        });

        // Convertir en structure hiérarchique
        this.hierarchyData = [{
          id: 'all-teams',
          name: 'Toutes les équipes',
          teamsCount: teamMap.size,
          teams: Array.from(teamMap.values())
        }];
      },
      error: (err) => {
        console.error('[DJ] Erreur chargement participants:', err);
        alert(`❌ Erreur: ${err.error?.message || err.message || 'Erreur inconnue'}`);
      }
    });
  }

  deletePlayer(playerId: string, nickname: string) {
    const confirmed = confirm(
      `🗑️ Supprimer le joueur "${nickname}" ?\n\n` +
      'Cette action est irréversible.\n' +
      'Le joueur devra se reconnecter pour rejoindre à nouveau.\n\n' +
      'Continuer ?'
    );

    if (!confirmed) {
      return;
    }

    console.log('[DJ] Suppression du joueur:', playerId);

    this.api.deletePlayer(playerId).subscribe({
      next: () => {
        console.log('[DJ] Joueur supprimé:', nickname);
        alert(`✅ Joueur "${nickname}" supprimé avec succès`);
        this.loadPlayers(); // Recharger la liste
      },
      error: (err) => {
        console.error('[DJ] Erreur suppression joueur:', err);
        const errorMessage = err.error?.message || err.message || 'Erreur inconnue';
        alert(`❌ Erreur de suppression :\n\n${errorMessage}`);
      }
    });
  }

  getPlayersByTeam() {
    const byTeam = new Map<string, typeof this.players>();
    this.players.forEach(player => {
      const teamName = player.teamName || `Équipe ${player.teamId}`;
      if (!byTeam.has(teamName)) {
        byTeam.set(teamName, []);
      }
      byTeam.get(teamName)!.push(player);
    });
    return byTeam;
  }

  getHierarchySummary(): string {
    if (this.hierarchyData.length === 0) return 'Aucune donnée';

    if (this.tableMode) {
      const totalTeams = this.hierarchyData.reduce((sum: number, t: any) => sum + t.teamsCount, 0);
      return `${this.hierarchyData.length} table(s) • ${totalTeams} équipe(s)`;
    } else {
      const totalPlayers = this.players.length;
      const totalTeams = this.hierarchyData[0]?.teams?.length || 0;
      return `${totalTeams} équipe(s) • ${totalPlayers} joueur(s)`;
    }
  }
}
