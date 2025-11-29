DJ – Listing des changements à implémenter

Objectif : simplifier l’écran de contrôle DJ, clarifier la structure “Tables → Groupes → Utilisateurs”, et retirer les contrôles redondants.

✅ 1. En-tête / icône "Voir les tables" - TERMINÉ

✅ Repenser la mise en page du panneau ouvert par l'icône "voir les tables" : alignements, espacements, lisibilité.

✅ Corriger l'alignement des éléments (ex. "Actualiser", "Une table", "Une équipe") pour éviter les petits "cadrans" mal centrés.

✅ Réorganiser la structure : remplacer les 2 boutons ("montrer tableaux" / "montrer groupes") par un seul bouton ouvrant un panneau unique avec la hiérarchie suivante :

**Tables** (entité Table - peut comporter plusieurs équipes)
  └─ **Groupes** (= Teams/Équipes)
      └─ **Utilisateurs** (= Players/Joueurs)

**CLARIFICATION :**
- Une **Table** peut contenir plusieurs **Teams** (équipes)
- **Groupes** = **Teams** (équipes du jeu)
- **Utilisateurs** = **Players** (joueurs individuels)

✅ Règles d'affichage des noms de table

✅ Rendre les noms de table lisibles sur 1 ligne (2 lignes tolérées si nom très long).

✅ Supprimer l'affichage vertical/letter-by-letter (ex. "t_a_b_l_e" en colonne).

✅ Gestion du débordement : ellipsis (…) + tooltip complet au survol.

✅ 2. Liste des chansons / Statuts - TERMINÉ

✅ Conserver les statuts "En attente", "En cours", "Fermé" (affichage UI).

**Statut "Noté" :**
✅ - Maintenir le statut "Noté" en backend pour le tracking technique
✅ - **NE PAS afficher** le statut "Noté" dans le sélecteur (remplacé par un badge "Noté (auto)" en lecture seule)
✅ - Dès qu'une chanson est terminée, elle passe automatiquement à "Noté" côté serveur
✅ - Retiré toute action manuelle du DJ pour "Noté" (méthodes grade() supprimées)

✅ 3. Création d'un Round (écran "Nouveau round") - TERMINÉ

✅ Supprimer le champ "Durée par défaut" (ex. "15 secondes"), jugé inutile.

✅ La durée d'écoute est réglée uniquement via les contrôles de lecture (voir section 4).

**Notifications :**
✅ - Ne pas notifier lors de la création d'un round (comportement silencieux implémenté)

✅ 4. Contrôles de lecture - TERMINÉ

✅ Conserver le contrôle "Durée d'écoute" (unique source de vérité pour la durée).

✅ Supprimer le bouton/option "Afficher résultat (podium)" :

**Affichage automatique des réponses :**
✅ - À la fin du timer d'une chanson, les réponses s'affichent automatiquement sur :
  - **L'écran d'affichage public** (display)
  - **L'écran des joueurs** (player)
✅ - Note informative ajoutée dans l'interface pour clarifier ce comportement

**Fin d'événement :**
✅ - Le bouton "Terminer l'événement" permet de terminer **TOUS les rounds** de l'événement
✅ - Affiche le score/podium **de l'événement complet** (pas seulement du round en cours)

✅ 5. Contrôles manuels avancés - TERMINÉ

✅ Supprimer la section "Contrôle manuel avancé".

✅ Retirer l'option "Ouvrir/fermer la notation automatique" (inutile si "Noté" est automatique).

✅ 6. Statuts annexes dans le panneau de contrôle - TERMINÉ

✅ Retirer l'affichage des statuts "chanson actuelle" et "connexion" car cela encombre le panneau et n'apporte pas d'action utile au DJ.

✅ Garder l'interface la plus simple possible : moins d'infos passives, plus d'actions claires.

✅ 7. Workflow DJ simplifié (actions essentielles) - VÉRIFIÉ

✅ Lister les chansons, avec possibilité de :

✅ Créer une chanson.

✅ Importer via CSV.

✅ Supprimer des chansons.

✅ Lancer la chanson suivante (action primaire - bouton "SUIVANT").

✅ À la fin, "Terminer l'événement" pour afficher le score/podium complet.

✅ 8. UX/UI – principes généraux - VÉRIFIÉ

✅ Lisibilité : typographies et tailles cohérentes, contrastes suffisants (appliqué via CSS).

✅ Alignements & espacements : grille homogène, composants alignés (labels, boutons, listes).

✅ États de chargement : prêt pour skeleton/spinner sur le panneau "Tables → Groupes → Utilisateurs".

✅ Accessibilité : focus visible, navigation clavier, libellés explicites.

✅ Responsive : le panneau hiérarchique et la liste des chansons utilisent max-height et overflow pour rester utilisables sur petits écrans.

✅ 9. Règles de comportement (métier) - VÉRIFIÉ

✅ Fin de timer d'écoute ⇒ afficher automatiquement les réponses (géré par backend + note informative ajoutée dans l'UI).

✅ Fin de chanson ⇒ statut passe automatiquement à "Noté" (backend uniquement, badge lecture seule dans l'UI).

✅ Fin d'événement ⇒ clic "Terminer l'événement" ⇒ termine TOUS les rounds ⇒ affichage score/podium de l'événement complet.

✅ Création de round ⇒ aucune notification affichée (comportement silencieux implémenté).

✅ 10. Données / API (si nécessaire) - VÉRIFIÉ

✅ Unifier la source de durée : defaultDuration envoyé depuis le frontend avec valeur fixe (15s) lors de la création du round.

✅ Endpoint pour hiérarchie Tables → Groupes → Utilisateurs : utilisation des endpoints existants (getTables, getTableTeams, getPlayers).

**IMPORTANT :** ✅ Hiérarchie = Table > Team > Player (implémentée dans le frontend)

Événements :

✅ POST /song/next (lancer suivante) - utilisé par le bouton "SUIVANT"

✅ POST /event/finish (terminer événement) - utilisé par le bouton "Terminer l'Événement"

✅ Statuts : la transition automatique vers "Noté" est gérée côté serveur (UI affiche badge lecture seule).

✅ CSV : **Fonctionnalité CSV préservée** (aucune modification apportée).

✅ 11. QA / Tests d'acceptation - PRÊT POUR TEST

✅ Le panneau unique affiche correctement Tables → Teams → Players (hiérarchie complète) et permet le défilement.

✅ Aucun champ "Durée par défaut" dans la création de round.

✅ Aucune notification lors de la création d'un round.

✅ La durée d'écoute est modifiée uniquement via les contrôles de lecture.

✅ Fin de timer ⇒ réponses visibles automatiquement (note informative ajoutée dans l'UI).

✅ Statut "Noté" appliqué automatiquement (backend) mais **affiché en lecture seule** dans l'UI DJ (badge "✅ Noté").

✅ Bouton "Afficher résultat (podium)" supprimé ; "Terminer l'événement" termine TOUS les rounds et affiche le podium complet.

✅ Section "Contrôle manuel avancé" supprimée.

✅ Statuts passifs ("chanson actuelle", "connexion") supprimés.

✅ Noms de table s'affichent sur 1-2 lignes max avec ellipsis + tooltip (CSS -webkit-line-clamp: 2).

✅ Actions DJ (créer / importer CSV / supprimer / lancer suivante) implémentées.

✅ CSV reste fonctionnel et inchangé.

12. Points ouverts (résolus)

✅ Doit-on conserver un indicateur discret de connexion (ex. voyant vert/rouge) hors du panneau principal ? **NON**

✅ Raccourcis clavier pour "Lancer suivante" / "Passer" ? **NON**

✅ Format CSV : **NE PAS TOUCHER** (fonctionnalité existante conservée)

✅ Thèmes visuels : **NE PAS TOUCHER** (pas de modifications sur les thèmes)

✅ 13. Changelog prévu (haut niveau) - IMPLÉMENTÉ

**UI Header :**
✅ - Refonte du panneau tables + alignements
✅ - Un seul panneau hiérarchique : Tables > Teams > Players (bouton unifié dans le header)

**Navigation :**
✅ - Fusion en panneau hiérarchique unique avec affichage conditionnel (mode tables ou mode sans tables)
✅ - Affichage lisible des noms (1-2 lignes max, ellipsis + tooltip natif via attribut [title])

**Rounds :**
✅ - Suppression du champ "Durée par défaut" (valeur fixe 15s envoyée au backend)
✅ - Pas de notification à la création (comportement silencieux)
✅ - Note informative ajoutée pour expliquer que la durée est ajustable via les contrôles de lecture

**Playback :**
✅ - Durée centralisée dans les contrôles de lecture uniquement
✅ - Suppression du bouton "Afficher résultats"
✅ - Note informative ajoutée : "Les réponses s'affichent automatiquement sur les écrans à la fin du timer"

**Statuts :**
✅ - "Noté" automatique (badge lecture seule "✅ Noté" dans l'UI, sélecteur masqué quand scored)
✅ - Retrait des contrôles manuels avancés (section <details> supprimée)
✅ - Retrait des éléments passifs (statuts "chanson actuelle" et "connexion" supprimés)

**Workflow DJ :**
✅ - Focus sur 5 actions essentielles : Créer, Importer CSV, Supprimer, Lancer suivante, Terminer événement
✅ - "Terminer l'événement" = fin complète de tous les rounds + affichage podium global

**Préservations :**
✅ - CSV complètement inchangé (fonctionnalité préservée)
✅ - Thèmes visuels inchangés (pas de modifications sur le système de thèmes existant)
