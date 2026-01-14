# Public

File statici serviti dalla root del server.

## Files

- `favicon.ico` - Favicon principale
- `robots.txt` - SEO: istruzioni per crawler
- `sitemap.xml` - SEO: mappa del sito
- `manifest.json` - PWA manifest (se app diventa PWA)
- `_redirects` - Redirects per SPA routing (Netlify/Vercel)

## Favicon Set

Includere varie dimensioni:
- `favicon.ico` (32x32)
- `favicon-16x16.png`
- `favicon-32x32.png`
- `apple-touch-icon.png` (180x180)
- `android-chrome-192x192.png`
- `android-chrome-512x512.png`

## robots.txt Example

```
User-agent: *
Allow: /

Sitemap: https://yourdomain.com/sitemap.xml
```

## _redirects Example (SPA)

```
/*    /index.html   200
```

## Usage

Files in `public/` sono accessibili direttamente:
```
https://yourdomain.com/favicon.ico
https://yourdomain.com/robots.txt
```

Non è necessario importarli nel codice.
