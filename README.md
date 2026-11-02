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

## Évolutions prioritaires après la formation

| # | Évolution | Effort |
|---|---|---|
| 1 | **Paiement en ligne** : le client paie son devis par Stripe (en mode test), avec un prix recalculé côté serveur, puis retrouve le détail de son paiement dans son espace. | **L** |
| 2 | **Suivi des ventes dans l'admin** : les devis payés sont signalés et le dashboard compare le chiffre d'affaires prévu (devis) et réel (paiements). | **M** |
| 3 | **Partage du devis** : le client connecté envoie à ses co-voyageurs un lien en lecture seule, qu'il peut révoquer. | **S** |

**Pourquoi ces priorités ?**

- **Paiement (valeur la plus forte)** : le parcours s'arrête aujourd'hui au devis. Le paiement transforme un outil de simulation en outil de vente : le client va jusqu'à l'achat sans conseiller. C'est l'évolution la plus lourde (paiement, webhook, sécurité du montant), d'où un démarrage en mode test.
- **Suivi des ventes (découle du paiement)** : une fois les paiements en place, l'agence doit voir ce qui est vendu, pas seulement simulé. Coût modéré, car le dashboard existe déjà.
- **Partage (gain rapide)** : un voyage se décide rarement seul ; partager le devis facilite la décision de groupe, donc la conversion. Petite évolution : un lien unique et une page en lecture seule.
- **Écartée pour l'instant** : la carte des étapes et hôtels du voyage. Appréciée, mais elle n'aide pas directement à vendre et demande de saisir les étapes de chaque voyage.

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
