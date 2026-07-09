# Site MDN — Moreno Débarras & Nettoyage

Site statique prêt pour GitHub Pages et le domaine `services-moreno.fr`.

## Fichiers inclus

- `index.html` : page principale + simulateur de devis
- `style.css` : design bleu / vert / blanc
- `script.js` : calcul débarras + nettoyage spécialisé + remise 10 %
- `mentions-legales.html` : mentions légales
- `confidentialite.html` : politique de confidentialité simple
- `cgv.html` : conditions générales simples
- `CNAME` : domaine personnalisé GitHub Pages
- `assets/logo-mdn.jpg` : logo MDN recadré depuis l'image fournie
- `assets/favicon.png` : icône du site

## À modifier avant publication

Dans `index.html`, remplace :

```html
https://formspree.io/f/xbdvnjjd
```

par l'URL de ton formulaire Formspree.

Sans ça, le simulateur fonctionne, mais l'envoi du formulaire est bloqué volontairement.

## Mise en ligne GitHub Pages

1. Créer un dépôt GitHub, par exemple `services-moreno`.
2. Envoyer tous les fichiers du dossier à la racine du dépôt.
3. Aller dans **Settings > Pages**.
4. Choisir **Deploy from a branch**.
5. Branch : `main` / Folder : `/root`.
6. Dans **Custom domain**, mettre : `services-moreno.fr`.
7. Activer **Enforce HTTPS** quand GitHub le propose.

## DNS domaine

Chez le fournisseur du domaine, configurer le domaine racine `services-moreno.fr` avec les A records GitHub Pages :

```text
@  A 185.199.108.153
@  A 185.199.109.153
@  A 185.199.110.153
@  A 185.199.111.153
```

Pour `www.services-moreno.fr`, créer un CNAME vers :

```text
TON-PSEUDO-GITHUB.github.io
```

Remplace `TON-PSEUDO-GITHUB` par ton nom d'utilisateur GitHub.
