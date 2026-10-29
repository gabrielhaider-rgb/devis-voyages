# PRD — Configurateur de voyages et devis en ligne

| | |
|---|---|
| **Projet** | Page web d'un tour-opérateur (fictif) : choisir un voyage, ajouter des options, générer un devis |
| **Nature** | Projet d'apprentissage / portfolio |
| **Stack** | Next.js 16 (App Router), Supabase (Postgres + RLS), Vercel, GitHub |
| **Rédigé le** | 29/10/2026 |
| **Échéance démo** | 30/10/2026 (J+1) |

---

## 1. Vision et problème

**Vision** : un client choisit un voyage, le configure (date de départ, nombre de voyageurs, options) et obtient seul son devis en quelques minutes, sans passer par un conseiller.

**Problème** : aujourd'hui, le client obtient son devis par email ou par téléphone. Un conseiller le prépare à la main, ce qui est lent pour le client et coûteux pour l'agence.

**Risque de ne rien faire** : délais de réponse longs, clients qui abandonnent, temps de conseiller passé sur des calculs répétitifs.

**Solution la plus légère retenue** : une page web qui affiche le catalogue, calcule le prix en direct et produit un devis imprimable en PDF. Pas de réservation ni de paiement.

## 2. Utilisateurs cibles

| Utilisateur | Besoin | Phase |
|---|---|---|
| **Client (visiteur)** | Trouver un voyage, le configurer, connaître le prix total et garder un devis | Démo, V1.1 |
| **Administrateur de l'agence** | Ajouter et modifier les voyages, départs et options sans toucher au code | V2 |
| **Administrateur de l'agence** | Suivre les devis enregistrés et retrouver les clients pour les recontacter | V4 |

## 3. Fonctionnalités et priorités

### Démo (V1) — J+1 (priorité absolue)

Parcours **sans compte** :

1. **Liste des voyages** : tous les voyages en cartes (image, titre, destination, durée, date et prix par personne du prochain départ). Pas de filtre.
2. **Page voyage** : description, puis configuration :
   - choix d'une **date de départ** parmi les départs fixes du voyage ;
   - choix du **nombre de voyageurs** (1 à 9) ;
   - sélection des **options** (cases à cocher) ;
   - sélection des **options d'accessibilité** pour les voyageurs en situation de handicap, dans une section distincte « Accessibilité » (voir ci-dessous).
3. **Calcul du prix en direct** : le total se met à jour à chaque changement, avec le détail des lignes.
4. **Page devis** : récapitulatif (voyage, date, voyageurs, options, options d'accessibilité, détail du calcul, total, date du devis et numéro du devis), mise en forme pour l'impression. Le bouton « Télécharger le PDF » ouvre l'impression du navigateur (`window.print()`, choix « Enregistrer en PDF »).
5. **Catalogue** : saisi en base par un **seed SQL** (environ 4 à 6 voyages), sans interface admin.

**Options d'accessibilité** : ce sont des options comme les autres (même table, même calcul), marquées par la catégorie `accessibility` pour être affichées dans leur propre section, sur la page voyage comme sur le devis. Exemples à prévoir dans le seed :

- chambre adaptée (PMR) ;
- transfert en véhicule adapté ;
- assistance à l'aéroport ;
- accompagnement par un guide formé.

Une option d'accessibilité peut avoir un prix de 0 € : elle est alors **incluse dans le voyage**. Elle s'affiche dans une liste « Inclus dans le voyage, sans supplément », sans case à cocher, n'entre pas dans le calcul du devis, et elle est rappelée sur le devis (« Accessibilité incluse, sans supplément »).

**Options non cumulables** : certaines options s'excluent (ex. « Transfert aéroport » et « Transfert en véhicule adapté » : c'est l'un ou l'autre ; en Islande, « Location d'un 4x4 » et « Véhicule adapté avec chauffeur »). Elles partagent un même groupe (`exclusive_group`) ; tant que l'une est cochée, les autres **disparaissent de l'affichage** (pour qu'un client ne croie pas devoir prendre les deux), et elles réapparaissent quand on la décoche. Chaque option du groupe affiche « Non cumulable avec : … ».

> Pour la démo, la configuration passe de la page voyage à la page devis par l'URL (paramètres de requête). Rien n'est enregistré en base. La page devis revérifie cette configuration (départ, nombre de voyageurs, options du voyage, options non cumulables) et affiche un message clair si elle n'est pas valide. Le numéro du devis est calculé à partir de la date et de la configuration.

### V1.1 — après la démo

- **Compte client** avec Supabase Auth, par email et mot de passe (même approche que Job Tracker) : inscription, connexion, mot de passe oublié, déconnexion. Un bandeau en haut du site affiche « Se connecter », ou « Mes devis » et « Se déconnecter ».
- **Le devis reste accessible sans compte.** Le compte ne sert qu'à l'enregistrer : le bouton « Enregistrer ce devis » demande de se connecter si besoin, puis ramène le client sur son devis.
- **Enregistrement des devis** : le serveur recalcule le devis à partir du catalogue avant de l'enregistrer, et garde une **copie figée** (voyage, date, voyageurs, lignes, total, accessibilité incluse). Si le catalogue change ensuite, le devis enregistré garde son prix d'origine.
- **Page « Mes devis »** : liste des devis enregistrés, du plus récent au plus ancien ; chaque devis s'ouvre dans la même mise en page imprimable, avec son bouton PDF.
- **Confirmation de l'email désactivée** dans Supabase pour la démo : le client est connecté dès l'inscription.
- Hors périmètre de la V1.1 : supprimer ou modifier un devis enregistré, page profil, connexion avec Google, envoi du devis par email.

### V2

- **Rôles** : table `profiles` (un profil par compte, créé automatiquement à l'inscription) avec une colonne `role` (`client` ou `admin`), vérifiée par les politiques RLS. Plusieurs admins sont possibles, et la sécurité est appliquée en base et pas seulement dans Next.js.
- **Premier admin** désigné une seule fois par une requête SQL ; ensuite, une page **Admins** permet à un admin de nommer d'autres admins ou de leur retirer ce rôle. Un admin ne peut jamais modifier son propre rôle (règle en base), pour ne pas se retrouver sans admin.
- **Interface admin** (`/admin`, lien « Admin » dans le bandeau pour les admins seulement) :
  - liste de tous les voyages, archivés compris ;
  - création d'un voyage : il reste archivé (invisible) jusqu'à sa publication, possible dès qu'il a au moins un départ ;
  - fiche voyage : informations, départs (ajouter, modifier, supprimer), options (libellé, prix, forfait ou par personne, option ou accessibilité, groupe non cumulable ; ajouter, modifier, supprimer), bouton « Archiver » ou « Publier sur le site ».
  - Les prix se saisissent en euros (« 650 » ou « 650,50 ») et sont stockés en centimes.
- **Archivage** plutôt que suppression d'un voyage (colonne `archived_at`) : un voyage archivé disparaît du site public mais reste réactivable. Supprimer un départ ou une option ne touche pas les devis déjà enregistrés (ce sont des copies).
- **Mise à jour immédiate** : chaque modification dans l'admin vide le cache du catalogue, le site public change tout de suite.
- Un compte non admin qui ouvre `/admin` voit une page « introuvable ».
- À la connexion, un admin arrive sur `/admin` (un client sur « Mes devis »), sauf s'il venait d'une page précise, comme un devis à enregistrer. Un badge « Administrateur » s'affiche dans le bandeau, et la page d'administration rappelle que les modifications s'appliquent immédiatement au site public.
- Hors périmètre de la V2 : voir les devis des clients, supprimer définitivement un voyage, photos, ordre d'affichage.

### V3 — Assistant conversationnel (texte)

- **Une bulle « Besoin d'aide ? »** en bas à droite de toutes les pages (sauf l'administration et l'impression), ouverte à tous, sans compte.
- Le visiteur décrit son projet (« 2 adultes, Lisbonne en mai, avec un transfert adapté ») et l'assistant :
  - cherche dans le catalogue les voyages et départs qui correspondent ;
  - pose les questions manquantes (date, nombre de voyageurs, options, besoins d'accessibilité) ;
  - chiffre une configuration et affiche une carte avec le prix et un bouton **« Voir et ajuster »**, qui ouvre la page du voyage **pré-remplie** (`/voyages/<voyage>?depart=…&voyageurs=…&options=…`). Le visiteur vérifie, ajuste, puis ouvre son devis comme d'habitude.
- **Garde-fous** :
  - l'assistant ne lit que le catalogue en ligne, par trois outils (lister les voyages, détailler un voyage, chiffrer une configuration) : il ne peut inventer ni voyage ni prix ;
  - le prix est toujours calculé par la fonction de calcul unique (section 4), avec les mêmes vérifications que la page devis (départ existant, 1 à 9 voyageurs, options du voyage, options non cumulables) ;
  - le visiteur valide toujours lui-même avant le devis ; une mention rappelle que les réponses sont générées par une IA.
- **Modèle** : Claude Haiku 5.5 (API Anthropic), appelé uniquement côté serveur (`/api/assistant`) ; la clé d'API (`ANTHROPIC_API_KEY`) est un secret, jamais exposée au navigateur.
- **Protection contre les abus et les attaques (DDoS)**, en quatre couches :
  1. protection anti-DDoS automatique de Vercel (et « Attack Mode » en cas d'attaque) ;
  2. règle de limitation de débit Vercel sur `/api/assistant` : 10 requêtes par minute et par adresse IP, bloquées avant d'atteindre le code ;
  3. plafonds enregistrés dans Supabase (migration 006) : 20 messages par heure et 50 par jour par adresse IP (stockée sous forme d'empreinte, jamais en clair) ; 300 par heure et 1 000 par jour pour tout le site ; au-delà, l'assistant répond qu'il est indisponible sans appeler Claude. S'y ajoutent 20 messages par conversation et 1 000 caractères par message ;
  4. limite de dépense mensuelle dans la console Anthropic, dernier filet.
- Hors périmètre de cette étape : la voix (étape suivante), l'historique des conversations, l'enregistrement du devis par l'assistant.
- **Étape suivante (voix)** : reconnaissance et synthèse vocales du navigateur (Web Speech API), le texte restant le mode principal.

### V4 — Suivi des devis et des clients (administration)

Objectif : donner à l'agence une vue d'ensemble des devis enregistrés et de ses clients, pour pouvoir les recontacter.

- **Profil enrichi** pour tous les comptes : **prénom** et **nom** (obligatoires à l'inscription), **téléphone** (facultatif, pour que l'agence puisse rappeler un client).
  - Une page **« Mon profil »** permet de les compléter ou de les modifier. Les comptes créés avant la V4 la complètent à leur rythme ; en attendant, leur email sert de nom.
  - Le nom, l'email et le téléphone du client apparaissent sur ses devis enregistrés (et donc sur le PDF).
- **Navigation de l'administration** en onglets : Catalogue · Devis · Clients · Admins.
- **Devis — vue Dashboard** :
  - chiffres clés : nombre de devis, montant total, montant moyen ;
  - par voyage : nombre de devis et montant total, du plus demandé au moins demandé ;
  - par période : graphique du nombre de devis par mois (12 derniers mois) ;
  - accessibilité : part des devis comprenant au moins une option d'accessibilité payante.
- **Devis — vue liste** : date, numéro, client, voyage, date de départ, voyageurs, total ; du plus récent au plus ancien.
- **Devis — vue détail** : le devis tel que le client le voit (même mise en page, imprimable), avec en plus un encadré client (nom, email, téléphone) et un lien vers sa fiche. Lecture seule.
- **Liste des clients** : nom, email, téléphone, date d'inscription, nombre de devis et montant total ; **recherche** par nom ou email. Un clic ouvre la **fiche client** avec la liste de ses devis.
- **Liste des admins** : séparée de celle des clients (nom, email, admin depuis), avec « Retirer le rôle admin » ; on nomme un admin depuis la fiche d'un client.
- **Changement de rôle** par une fonction en base (`set_user_role`) qui vérifie que l'appelant est admin et refuse son propre compte : chacun peut modifier son prénom, son nom et son téléphone, jamais son rôle.
- « Mes devis » reste limité aux devis du compte connecté, même pour un admin (qui peut lire tous les devis dans l'administration).
- Hors périmètre de la V4 : modifier ou supprimer un devis, statut de suivi commercial (« à rappeler », « réservé »…), export CSV, envoi d'emails, filtres de dates avancés.

## 4. Règles de calcul du prix

```
total = prix_par_personne(départ choisi) × voyageurs
      + Σ options à prix fixe
      + Σ (options par personne × voyageurs)
```

- Les prix sont stockés **en centimes** (entiers) pour éviter les erreurs d'arrondi, et affichés en euros TTC.
- Le calcul se fait dans **une seule fonction**, réutilisée par la page voyage et par la page devis.
- Sur l'accueil, chaque voyage affiche la date et le prix par personne de son **prochain départ** (le plus proche à partir d'aujourd'hui, heure de Paris), et non plus le prix le plus bas. Les départs passés sont ignorés ; sans départ à venir, la carte indique « Aucun départ prévu ».

### Cas de test (référence pour valider la démo)

Voyage « Lisbonne, 5 jours ». Départs : 12/05/2027 à 650 € par personne, 14/07/2027 à 820 € par personne.
Options : assurance annulation (40 € par personne), transfert aéroport (60 €, fixe), excursion Sintra (35 € par personne).
Options d'accessibilité : transfert en véhicule adapté (80 €, fixe), assistance à l'aéroport (0 €, incluse : non sélectionnable).

| # | Configuration | Calcul | Total attendu |
|---|---|---|---|
| 1 | 12/05, 1 voyageur, aucune option | 650 × 1 | **650 €** |
| 2 | 12/05, 2 voyageurs, assurance + transfert | 650 × 2 + 40 × 2 + 60 | **1 440 €** |
| 3 | 14/07, 4 voyageurs, assurance + transfert + Sintra | 820 × 4 + 40 × 4 + 60 + 35 × 4 | **3 640 €** |
| 4 | 12/05, 2 voyageurs, assurance + véhicule adapté | 650 × 2 + 40 × 2 + 80 | **1 460 €** |

## 5. Modèle de données (aperçu)

| Table | Champs principaux | Phase |
|---|---|---|
| `trips` | `id`, `slug`, `title`, `destination`, `duration_days`, `description`, `image_url` | Démo |
| `departures` | `id`, `trip_id`, `departure_date`, `price_per_person_cents` | Démo |
| `options` | `id`, `trip_id`, `label`, `price_cents`, `pricing_type` (`fixed` ou `per_person`), `category` (`standard` ou `accessibility`), `exclusive_group` (options non cumulables) | Démo |
| `quotes` | `id`, `user_id`, `trip_slug`, `trip_title`, `destination`, `duration_days`, `departure_date`, `travelers`, `lines` (JSON), `included_accessibility` (JSON), `total_cents`, `created_at` — copie figée du devis | V1.1 |
| `profiles` | `id` (= `auth.users.id`), `email`, `role` (`client` ou `admin`), `created_at` | V2 |
| `trips.archived_at` | date d'archivage (`null` = en ligne) | V2 |
| `assistant_usage` | compteurs de messages de l'assistant par empreinte d'IP et pour tout le site, par heure et par jour | V3 |
| `profiles` (ajouts) | `first_name`, `last_name`, `phone` (facultatif), `admin_since` | V4 |
| `quotes` (ajout) | `has_accessibility` : au moins une option d'accessibilité payante (calculé à l'enregistrement) | V4 |

**RLS** :
- Démo : lecture publique (`select` pour `anon`) sur `trips`, `departures` et `options`, et aucune écriture.
- V1.1 : un utilisateur ne lit et ne crée que ses propres `quotes` (ni modification ni suppression).
- Limite connue : un client qui appelle l'API Supabase directement pourrait enregistrer un devis avec un montant inventé, visible par lui seul. Le devis restant indicatif, c'est acceptable pour la V1.1 ; un enregistrement par une fonction côté base corrigerait ce point plus tard.
- V2 : écriture sur le catalogue réservée aux admins (fonction `is_admin()`) ; voyages archivés invisibles pour les visiteurs ; un admin ne peut pas modifier son propre rôle.
- V4 : les admins lisent tous les devis (lecture seule) ; chaque utilisateur peut modifier son prénom, son nom et son téléphone, mais jamais son rôle.
- Limite connue (V4) : les devis enregistrés avant la V4 ne savent pas s'ils contenaient une option d'accessibilité payante ; ils sont comptés « sans » dans le dashboard.

## 6. Hors périmètre

- Réservation et paiement en ligne.
- Filtres, recherche et tri des voyages.
- Prix par saison et dates de départ libres (seulement des départs fixes).
- Gestion des places disponibles ou des stocks.
- Envoi d'emails (devis, confirmations).
- PDF généré par une bibliothèque (l'impression du navigateur suffit).
- Multilingue et multidevise.
- Interface admin avant la V2.
- Agent conversationnel (texte ou voix) avant la V3.
- Suivi commercial des devis (statuts, relances) et export, y compris en V4.

## 7. Contraintes techniques

- **Next.js 16 (App Router)** : pages en Server Components pour la lecture du catalogue, et un composant client pour la configuration et le calcul en direct.
- **Supabase** : Postgres avec RLS activé sur toutes les tables ; seed SQL versionné dans le dépôt.
- **Déploiement** : Vercel, branché sur GitHub ; variables d'environnement Supabase configurées sur Vercel.
- **Responsive** : parcours complet utilisable sur mobile (largeur 375 px).
- **Impression** : feuille de style `@media print` pour la page devis (masquer la navigation et les boutons, mise en page A4).

## 8. Métriques de succès (démo)

| Métrique | Critère |
|---|---|
| Parcours sans bug | Un devis complet est obtenu de bout en bout sur l'URL Vercel |
| Prix justes | Les 4 cas de test de la section 4 donnent exactement les totaux attendus |
| Rapidité | Un nouvel utilisateur obtient son devis en moins de 2 minutes |
| Mobile | Le parcours complet fonctionne sur un téléphone |

## 9. Calendrier

### Démo — 30/10/2026

Étapes dans l'ordre (chacune doit être testable avant de passer à la suivante) :

1. Projet Next.js, dépôt GitHub, projet Supabase.
2. Schéma (`trips`, `departures`, `options`), RLS en lecture publique, seed SQL (options d'accessibilité comprises).
3. Page liste des voyages.
4. Page voyage : configuration, section « Accessibilité » et calcul du prix en direct.
5. Page devis imprimable (`@media print`).
6. Déploiement Vercel, vérification des 4 cas de test et test sur mobile.

### Après la démo (sans date fixée)

- **V1.1** : compte client et historique des devis.
- **V2** : rôles, interface admin du catalogue, archivage des voyages, gestion des admins.
- **V3** : assistant conversationnel en texte (bulle sur toutes les pages, Claude Haiku 5.5, protections anti-abus), puis la voix.
- **V4** : profil enrichi (nom, prénom, téléphone), dashboard et liste des devis, liste des clients et des admins. Elle ne dépend pas de la V3 et peut être construite avant.

## 10. Risques et décisions

### Risques

| Risque | Impact | Mitigation |
|---|---|---|
| Délai d'un jour | Démo incomplète | Périmètre réduit au parcours sans compte ; étapes ordonnées pour avoir toujours une version montrable |
| Erreur de calcul | Perte de confiance | Prix en centimes, fonction de calcul unique, cas de test de référence |
| Rendu de l'impression variable selon le navigateur | PDF peu soigné | Tester l'impression sur Chrome et Safari ; garder une mise en page sobre |

### Journal des décisions

| Date | Décision | Justification | Conséquence |
|---|---|---|---|
| 29/10/2026 | Devis uniquement, pas de réservation ni de paiement | Réduire le périmètre ; le paiement est complexe | La réservation se fait hors du site |
| 29/10/2026 | Démo sans compte | Délai d'un jour : l'auth ajoute du risque | Compte et historique des devis en V1.1 |
| 29/10/2026 | PDF par l'impression du navigateur | Aucune dépendance, rapide à livrer | Rendu dépendant du navigateur |
| 29/10/2026 | Départs fixes avec un prix par départ | Plus simple que des saisons | Pas de date libre |
| 29/10/2026 | Catalogue saisi par seed SQL, admin en V2 | Prioriser le parcours client | Modifier le catalogue demande du SQL jusqu'à la V2 |
| 29/10/2026 | Rôle admin dans `profiles.role`, vérifié par RLS | Sécurité en base, plusieurs admins possibles | Une table et des politiques de plus en V2 |
| 29/10/2026 | Options d'accessibilité dès la V1 (démo), dans la table `options` avec une catégorie | Besoin demandé pour la V1 ; réutiliser la table et le calcul existants plutôt que créer un mécanisme à part | Une colonne `category` et une section d'affichage de plus |
| 29/10/2026 | Agent conversationnel (texte ou voix) en V3 | Améliore l'aide au devis, mais dépend d'un parcours et d'un catalogue stables | L'agent s'appuie sur le catalogue en base et sur la fonction de calcul unique |
| 29/10/2026 | Options à 0 € affichées comme incluses, sans case à cocher | Cocher une prestation gratuite et incluse n'a pas de sens pour le client | Ces options n'apparaissent pas dans le calcul du devis |
| 29/10/2026 | Transferts non cumulables, via une colonne `exclusive_group` | Un client prend soit le transfert classique, soit le véhicule adapté | Cocher l'un masque l'autre ; la règle est réutilisable pour d'autres options |
| 29/10/2026 | V1.1 : compte demandé seulement pour enregistrer un devis | Garder le parcours de la démo sans friction | Le devis reste consultable et imprimable sans compte |
| 29/10/2026 | V1.1 : connexion par email et mot de passe | Approche déjà connue (Job Tracker) | Pages inscription, connexion, mot de passe oublié |
| 29/10/2026 | V1.1 : devis enregistré en copie figée | Un devis doit garder son prix, comme un devis papier | Les lignes et le total sont stockés tels quels dans `quotes` |
| 29/10/2026 | V1.1 : confirmation de l'email désactivée pour la démo | Éviter d'ouvrir une boîte mail pendant la démo | Moins sûr : à réactiver avant un usage réel |
| 29/10/2026 | V2 : archiver un voyage plutôt que le supprimer | Pouvoir le réactiver ; ne rien perdre | Colonne `archived_at`, voyages archivés masqués par la RLS |
| 29/10/2026 | V2 : page de gestion des admins | Nommer des admins sans SQL | Seul le premier admin passe par une requête SQL |
| 29/10/2026 | V2 : l'admin ne voit pas les devis des clients | Rester sur la gestion du catalogue | Pourra venir dans une version suivante |
| 29/10/2026 | Accueil : prix du prochain départ au lieu du prix « à partir de » | Une hausse de prix sur le prochain départ restait invisible (ex. Islande à 2 000 € affichée 1 890 €) | La carte montre la date et le prix du départ le plus proche |
| 29/10/2026 | V4 : suivi des devis et des clients dans l'administration | Permettre à l'agence de recontacter les clients et de voir quels voyages intéressent | Profil enrichi, lecture de tous les devis par les admins (RLS) |
| 29/10/2026 | V4 : prénom et nom obligatoires, téléphone facultatif | Identifier le client sans imposer un numéro | Inscription modifiée ; page « Mon profil » pour les comptes existants |
| 29/10/2026 | V3 : assistant ouvert à tous, sans compte | Aucune friction pour le visiteur | Protections anti-abus en quatre couches, dont un plafond quotidien pour tout le site |
| 29/10/2026 | V3 : Claude Haiku 5.5 plutôt qu'un modèle plus grand ou un modèle ouvert | Coût très bas (environ un centime par conversation), fiable avec les outils, même architecture que le site | Réponses moins fines sur les demandes complexes ; modèle ouvert écarté (hébergement trop lourd) |
| 29/10/2026 | V3 : texte d'abord, la voix ensuite | Livrer un assistant fiable avant d'ajouter la voix | La voix fera l'objet d'une étape suivante |
| 29/10/2026 | V3 : bulle de discussion sur toutes les pages | Aide visible partout dans le parcours | Masquée dans l'administration et à l'impression |
