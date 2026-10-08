# Kalongo Farm

Static hotel website on Vercel. Media lives on Cloudinary. Admin login is Firebase Authentication. The site catalog is a Cloudinary JSON file written by `/api/publish`.

## Architecture

- **Vercel** — public site (`frontend/`) and `/api/publish`
- **Firebase Auth** — Admin login only (no Firestore / Storage)
- **Cloudinary** — images, videos, and the persistent catalog at `kalongo/site-content`
- **WhatsApp** — booking

## Local preview

```bash
cd frontend
python3 -m http.server 8000
```

Then open http://localhost:8000

Admin Save (`/api/publish`) only works on Vercel, where `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` are set.

## Deploy

Vercel build (`vercel.json`):

```text
node scripts/write-frontend-config.js
```

Output directory: `frontend`

### Environment variables (Vercel)

Firebase Auth (injected into `frontend/js/kalongo-config.js` at build):

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET` (unused; Auth only)
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Cloudinary:

- `CLOUDINARY_CLOUD_NAME` (default `dae3rpnmg`)
- `CLOUDINARY_UPLOAD_PRESET` (unsigned media uploads: `kalongo_unsigned`)
- `CLOUDINARY_CONTENT_PUBLIC_ID` (`kalongo/site-content`)
- `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` (server only, for `/api/publish`)

See `.env.example`.

## Project structure

```text
KALONGOWEB/
├── frontend/                 # Public site + /admin
│   ├── data/site.json        # Bundled catalog fallback
│   ├── js/site-content.js    # Load catalog + unsigned media upload
│   └── admin/                # Firebase-gated Admin UI
├── api/publish.js            # Signed Cloudinary catalog overwrite
├── scripts/write-frontend-config.js
└── vercel.json
```

## Admin

- URL: `/admin`
- Sign in with Firebase Email/Password
- Uploads use unsigned preset `kalongo_unsigned`
- Save publishes the catalog through `/api/publish`
