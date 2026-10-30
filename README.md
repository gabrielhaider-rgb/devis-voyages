# Devis voyages

**Le site d'un tour-opérateur (fictif) où le client choisit un voyage, le configure et obtient seul son devis en PDF, en moins de 2 minutes, avec un assistant IA qui l'aide à l'écrit comme à la voix.**

| | |
|---|---|
| 🌍 **Site en ligne** | **https://devis-voyages.vercel.app** |
| 📄 **PRD (cahier des charges)** | [PRD.md](PRD.md) (lisible sur GitHub) · [version PDF](docs/PRD-devis-voyages.pdf) |
| 🎓 **Nature** | Projet d'apprentissage / portfolio |

---

## Le problème

Aujourd'hui, le client d'une agence de voyages obtient son devis par email ou par téléphone : un conseiller le prépare à la main. C'est lent pour le client, qui risque d'abandonner, et coûteux pour l'agence.

## La solution

Une page web qui affiche le catalogue, calcule le prix en direct et produit un devis imprimable en PDF, sans passer par un conseiller.

## Fonctionnalités livrées

| Version | Contenu |
|---|---|
| **V1 — Démo** | Catalogue de 5 voyages à départs fixes ; configurateur (date, voyageurs, options, dont des options non cumulables) ; prix calculé en direct ; devis imprimable en PDF ; options d'accessibilité (chambre adaptée et assistance incluses, transfert en véhicule adapté en option) |
| **V1.1 — Comptes** | Inscription et connexion ; enregistrement des devis ; « Mes devis » ; mot de passe oublié |
| **V2 — Administration** | Rôle admin ; gestion du catalogue (voyages, départs, options, photos) ; archivage ; gestion des admins |
| **V3 — Assistant** | Bulle d'aide sur tout le site (Claude Haiku 5.5) qui propose une configuration chiffrée ; en texte et à la voix (dictée et lecture à voix haute) ; protections contre les abus (limites par IP et globales, pare-feu Vercel) |
| **V4 — Suivi** | Profil (prénom, nom, téléphone) ; dashboard des devis ; listes des devis, des clients et des admins ; espace client personnalisé |
| **Design** | Identité « Carnet de voyage » : tons sable et terre cuite, titres Fraunces, photos des destinations ; contrastes vérifiés |

## Prochaines étapes (V5, à cadrer)

1. Paiement en ligne (Stripe, en mode test).
2. Détails du paiement dans l'espace client.
3. Devis payés dans l'administration et dashboard « prévisionnel / réel ».
4. Partage du devis par lien.
5. Carte des étapes et hôtels du voyage.

Le détail, les règles de calcul, les cas de test et le journal des décisions sont dans le [PRD](PRD.md).

## Stack technique

- **Next.js 16** (App Router, Server Components, Server Actions) et **Tailwind CSS**
- **Supabase** : Postgres avec RLS sur toutes les tables, authentification, fonctions SQL sécurisées
- **Vercel** : déploiement continu depuis GitHub, pare-feu (limitation de débit sur l'assistant)
- **API Anthropic** (Claude Haiku 5.5) avec outils pour l'assistant ; **Web Speech API** du navigateur pour la voix
- **Vitest** : 76 tests (calcul des prix, validations, assistant, textes)

Les prix sont calculés en centimes par une fonction unique, utilisée à la fois par le configurateur, le devis enregistré et l'assistant.

## Lancer le projet en local

1. Installer les dépendances :
   ```bash
   npm install
   ```
2. Copier `.env.example` en `.env.local` et renseigner l'URL et la clé publique Supabase, ainsi que la clé d'API Anthropic (pour l'assistant).
3. Dans Supabase, exécuter dans l'ordre les migrations de [`supabase/migrations`](supabase/migrations), puis [`supabase/seed.sql`](supabase/seed.sql).
4. Démarrer :
   ```bash
   npm run dev
   ```
   Le site est sur http://localhost:3000.
5. Lancer les tests :
   ```bash
   npm test
   ```
