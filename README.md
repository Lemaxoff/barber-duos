# Barber Duo’s — version autonome pour Vercel

## Installation et lancement

Prérequis : Node.js 22 et pnpm 11.25.0. À la racine du projet :

```bash
pnpm install --frozen-lockfile
pnpm dev
```

## Tests et build

```bash
pnpm test
pnpm build
```

Le site statique prêt à publier est généré dans `dist/`. Sur Vercel, importez le dépôt ou le dossier de projet, utilisez la commande de build `pnpm build` et le dossier de sortie `dist` (Vercel détecte aussi Vite automatiquement).

## Vercel Web Analytics

Le point d’entrée appelle `inject()` depuis `@vercel/analytics` uniquement dans le build de production. Après le premier déploiement, activez **Web Analytics** dans le tableau de bord du projet Vercel (onglet Analytics) pour que Vercel accepte les événements et affiche les visites. Aucun identifiant ou secret n’est nécessaire dans le code.

## Fidélité et ressources

La feuille CSS originale fournie dans l’archive source est conservée octet pour octet sous `public/css/`. Le DOM, les classes d’origine et les images sont servis localement. Aucun script ou SDK de plateforme n’est requis à l’exécution.
