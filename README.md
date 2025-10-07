# DoualaLuxuryRent — Pack PRO (statique + PWA)

- UI/UX premium (Tailwind via CDN)
- Pages : Accueil, Flotte, Réservation, À propos, Contact
- PWA : manifest + service worker (offline)
- Paiements : hooks Orange Money / MTN MoMo (à raccorder côté serveur)
- SEO : OpenGraph + JSON-LD CarRental
- Assets : intégrés depuis votre archive

## Déploiement
- GitHub Pages : pousser le dossier au root, activer Pages (Deploy from a branch -> main).
- Netlify/Vercel : drag & drop.

## Intégration paiements (back-end requis)
Créez un endpoint qui génère une session OM/MoMo et renvoie l’URL de checkout, plus un webhook de confirmation. Remplacez ensuite les `#...checkout` dans `pages/booking.html`.

Bon déploiement !