# 📌 Pinterest Clone — Project Documentation

A full-stack, functional clone of **Pinterest** built to match the real product's UI end-to-end and implement every feature for real (no mocks).

- **Frontend:** Next.js 16 (App Router) + React 19 + Tailwind CSS v4
- **Backend:** FastAPI (Python 3.13) + SQLAlchemy 2 + **SQLite**
- **Image processing:** Pillow (thumbnails + dominant-color extraction)
- **Auth:** JWT (PyJWT) + bcrypt password hashing

---

## 1. Table of Contents

1. [Architecture](#2-architecture)
2. [Tech Stack & Dependencies](#3-tech-stack--dependencies)
3. [Project Structure](#4-project-structure)
4. [Database Schema](#5-database-schema)
5. [REST API Reference](#6-rest-api-reference)
6. [Application Flows](#7-application-flows)
7. [Feature List](#8-feature-list)
8. [Setup & Run](#9-setup--run)
9. [Seed Data](#10-seed-data)
10. [Demo Script](#11-demo-script)
11. [Notes & Limitations](#12-notes--limitations)

---

## 2. Architecture

```
┌──────────────────────────┐         HTTP / JSObeN          ┌──────────────────────────┐
│   Frontend (Next.js 16)   │  ───────────────────────▶   │   Backend (FastAPI)        │
│   localhost:3000          │   Bearer JWT in header       │   localhost:8000           │
│                           │  ◀───────────────────────    │                            │
│  • App Router pages       │                              │  • REST routers            │
│  • React components       │     /uploads/<file>.jpg      │  • JWT auth (PyJWT+bcrypt) │
│  • TanStack Query (cache) │  ◀───────────────────────    │  • Pillow image pipeline   │
│  • Tailwind v4 styling    │     static image files       │  • SQLAlchemy ORM          │
└──────────────────────────┘                              └────────────┬─────────────┘
                                                                        │
                                                                        ▼
                                                            ┌──────────────────────────┐
                                                            │   SQLite (pinterest.db)   │
                                                            │   + /uploads image files  │
                                                            └──────────────────────────┘
```

- The frontend talks to the backend purely over a REST/JSON API (base URL set by `NEXT_PUBLIC_API_URL`).
- Uploaded/seed images are stored as files in `backend/uploads/` and served as static files at `/uploads/...`.
- The database is a single SQLite file (`backend/data/pinterest.db`) with WAL mode + foreign keys enabled.

---

## 3. Tech Stack & Dependencies

### Backend — Python 3.13 (`backend/requirements.txt`)


| Library               | Version | What it's used for                                                                           |
| --------------------- | ------- | -------------------------------------------------------------------------------------------- |
| **fastapi**           | 0.115.6 | Web framework — routing, request/response, dependency injection, OpenAPI docs                |
| **uvicorn[standard]** | 0.34.0  | ASGI server that runs the FastAPI app                                                        |
| **sqlalchemy**        | 2.0.36  | ORM — models, relationships, queries against SQLite                                          |
| **pydantic**          | 2.10.4  | Request/response validation & serialization schemas                                          |
| **pydantic-settings** | 2.7.1   | Loads config/env vars (`.env`) into a typed `Settings` object                                |
| **bcrypt**            | 4.2.1   | Password hashing (salted) for signup/login                                                   |
| **pyjwt**             | 2.10.1  | Encode/decode JWT access tokens for auth                                                     |
| **python-multipart**  | 0.0.20  | Parses `multipart/form-data` — required for image file uploads                               |
| **pillow**            | 11.1.0  | Image processing — validate, resize, convert, and extract the **dominant color** of each pin |
| **email-validator**   | 2.2.0   | Validates email addresses (used by Pydantic `EmailStr`)                                      |
| **httpx**             | 0.28.1  | HTTP client — used by the seed script to download sample images and by "save from URL"       |


> **Standard library used:** `sqlite3` (via SQLAlchemy), `uuid` (filenames), `datetime`, `pathlib`, `io`, `re`, `unicodedata`.

### Frontend — Node 20 (`frontend/package.json`)


| Library                                    | Version     | What it's used for                                                  |
| ------------------------------------------ | ----------- | ------------------------------------------------------------------- |
| **next**                                   | 16.2.7      | React framework (App Router, file-based routing, server components) |
| **react / react-dom**                      | 19.2.4      | UI library                                                          |
| **@tanstack/react-query**                  | ^5.101      | Data fetching, caching, **infinite scroll** pagination              |
| **react-icons**                            | ^5.6        | Icon set (Pinterest "P" logo + a few UI icons)                      |
| **tailwindcss** + **@tailwindcss/postcss** | ^4          | Utility-first styling (CSS-based `@theme` config)                   |
| **typescript**                             | ^5          | Static typing across the frontend                                   |
| **eslint / eslint-config-next**            | ^9 / 16.2.7 | Linting                                                             |


> Most Pinterest icons are **inline SVGs with the exact Pinterest paths** (`components/icons.tsx`), not an icon library, for pixel fidelity.

---

## 4. Project Structure

```
Clone/
├── DOCUMENTATION.md            ← this file
├── backend/                    ← FastAPI app
│   ├── .venv/                  ← Python 3.13 virtualenv
│   ├── requirements.txt
│   ├── data/pinterest.db       ← SQLite database (gitignored)
│   ├── uploads/                ← stored pin + avatar images, served at /uploads
│   ├── app/
│   │   ├── main.py             ← app factory, CORS, static mount, router wiring
│   │   ├── config.py           ← Settings (env, paths, secret key)
│   │   ├── database.py         ← engine, session, Base, SQLite pragmas
│   │   ├── models.py           ← SQLAlchemy ORM models (the schema)
│   │   ├── schemas.py          ← Pydantic request/response models
│   │   ├── security.py         ← bcrypt hashing + JWT encode/decode
│   │   ├── deps.py             ← auth dependencies (current user / optional)
│   │   ├── serializers.py      ← ORM → dict (batched counts, no N+1)
│   │   ├── utils.py            ← slugify(), media_url()
│   │   ├── services/images.py  ← Pillow pipeline (resize + dominant color)
│   │   └── routers/            ← auth, users, pins, boards, comments, search
│   └── seed/
│       ├── seed.py             ← downloads images + builds demo dataset
│       └── data.py             ← content pools (users, topics, titles…)
└── frontend/                   ← Next.js app
    ├── package.json
    ├── .env.local              ← NEXT_PUBLIC_API_URL
    ├── app/                    ← routes (App Router)
    │   ├── layout.tsx          ← root layout → <AppShell>
    │   ├── page.tsx            ← "/"          Home feed
    │   ├── explore/page.tsx    ← "/explore"   Topics + feed
    │   ├── search/page.tsx     ← "/search"    Search results
    │   ├── create/page.tsx     ← "/create"    Create / upload pin
    │   ├── pin/[id]/page.tsx   ← "/pin/:id"   Pin closeup
    │   ├── [username]/page.tsx ← "/:user"     Profile
    │   └── [username]/[board]/page.tsx ← "/:user/:board"  Board page
    ├── components/             ← 21 React components (see below)
    └── lib/
        ├── api.ts              ← fetch wrapper + token storage
        ├── auth.tsx            ← AuthProvider / useAuth
        ├── modal.tsx           ← auth-modal controller
        ├── toast.tsx           ← toast notifications
        ├── providers.tsx       ← QueryClient + Auth + Toast + Modal
        ├── format.ts           ← timeAgo(), formatCount()
        └── types.ts            ← shared TypeScript types
```

**Key components:** `AppShell`, `LeftRail`, `Header`, `MasonryGrid`, `PinFeed`, `PinCard`, `PinDetail`, `Comments`, `BoardPickerModal`, `PinActionsMenu`, `AuthModal`, `Profile`, `BoardView`, `BoardCard`, `CreatePin`, `SearchView`, `ExploreView`, `RailFlyout`, `Avatar`, `Spinner`, `icons`.

---

## 5. Database Schema

11 tables. All timestamps are UTC. Foreign keys are enforced (SQLite `PRAGMA foreign_keys=ON`).

```
users ──< pins >── boards ──< board_sections
  │  \         \      │  \
  │   \         \     │   └─< board_collaborators >── users
  │    \         \    │
  │     \         \   └─< saves >── pins / board_sections   (a pin saved onto a board)
  │      \         \
  │       \         └─< comments (self-ref parent_id) >── users
  │        \
  │         └─< reactions (polymorphic: pin | comment) >── users
  │
  └─< follows >── users        topics ──< pin_topics >── pins
```

### `users`


| Column          | Type     | Notes           |
| --------------- | -------- | --------------- |
| id              | int PK   |                 |
| email           | str      | unique, indexed |
| username        | str      | unique, indexed |
| hashed_password | str      | bcrypt          |
| full_name       | str      |                 |
| avatar          | str?     | image filename  |
| bio, website    | str      |                 |
| birthdate       | str?     | from signup     |
| is_business     | bool     |                 |
| created_at      | datetime |                 |


### `pins`


| Column                                          | Type         | Notes                             |
| ----------------------------------------------- | ------------ | --------------------------------- |
| id                                              | int PK       |                                   |
| uploader_id                                     | FK → users   |                                   |
| title, description, alt_text, link, source_name | str          |                                   |
| image                                           | str          | stored filename (or external URL) |
| width, height                                   | int          |                                   |
| dominant_color                                  | str          | hex, e.g. `#5d5164` (Pillow)      |
| board_id                                        | FK → boards? | original board                    |
| created_at                                      | datetime     | indexed                           |


### `boards`


| Column                  | Type       | Notes                  |
| ----------------------- | ---------- | ---------------------- |
| id                      | int PK     |                        |
| owner_id                | FK → users |                        |
| name, slug, description | str        | unique(owner_id, slug) |
| is_secret               | bool       |                        |
| created_at              | datetime   |                        |


### `board_sections`

`id`, `board_id` FK, `name`, `slug` — unique(board_id, slug)

### `board_collaborators`

`id`, `board_id` FK, `user_id` FK — unique(board_id, user_id)

### `saves` (the "repin" join — a pin saved onto a board)


| Column     | Type                 | Notes                    |
| ---------- | -------------------- | ------------------------ |
| id         | int PK               |                          |
| pin_id     | FK → pins            | unique(pin_id, board_id) |
| board_id   | FK → boards          |                          |
| section_id | FK → board_sections? |                          |
| user_id    | FK → users           |                          |
| note       | str                  |                          |
| created_at | datetime             | indexed                  |


### `comments`

`id`, `pin_id` FK, `user_id` FK, `parent_id` FK→comments? (replies), `text`, `created_at`

### `reactions` (polymorphic)


| Column      | Type       | Notes                                   |
| ----------- | ---------- | --------------------------------------- |
| id          | int PK     |                                         |
| user_id     | FK → users |                                         |
| target_type | str        | `"pin"` or `"comment"`                  |
| target_id   | int        | id of the pin/comment                   |
| type        | str        | like / heart / applause / wow / idea    |
|             |            | unique(user_id, target_type, target_id) |


### `follows`

`id`, `follower_id` FK, `following_id` FK — unique(follower_id, following_id)

### `topics` & `pin_topics`

- `topics`: `id`, `name`, `slug` (unique), `image`, `category`
- `pin_topics`: `id`, `pin_id` FK, `topic_id` FK — unique(pin_id, topic_id) — drives related interests + topic search

---

## 6. REST API Reference

Base URL: `http://localhost:8000`. Auth endpoints return `{ access_token, token_type }`; protected endpoints expect `Authorization: Bearer <token>`. Interactive docs at `**/docs**`.

### Auth


| Method | Path               | Description            |
| ------ | ------------------ | ---------------------- |
| POST   | `/api/auth/signup` | Create account → JWT   |
| POST   | `/api/auth/login`  | Email + password → JWT |
| GET    | `/api/auth/me`     | Current user (auth)    |


### Users / Profiles / Follow


| Method        | Path                                  | Description                   |
| ------------- | ------------------------------------- | ----------------------------- |
| PATCH         | `/api/users/me`                       | Update profile (auth)         |
| GET           | `/api/users/{username}`               | Public profile + counts       |
| GET           | `/api/users/{username}/boards`        | User's boards                 |
| GET           | `/api/users/{username}/boards/{slug}` | One board by slug             |
| GET           | `/api/users/{username}/pins`          | Pins the user created (paged) |
| GET           | `/api/users/{username}/saved`         | Pins the user saved (paged)   |
| POST / DELETE | `/api/users/{username}/follow`        | Follow / unfollow (auth)      |


### Pins


| Method         | Path                      | Description                                             |
| -------------- | ------------------------- | ------------------------------------------------------- |
| GET            | `/api/pins/feed`          | Home feed, cursor-paginated                             |
| POST           | `/api/pins`               | Create pin — `multipart` file **or** `image_url` (auth) |
| GET            | `/api/pins/{id}`          | Pin detail                                              |
| GET            | `/api/pins/{id}/related`  | Related pins                                            |
| GET            | `/api/pins/{id}/download` | Download image (`Content-Disposition: attachment`)      |
| PATCH / DELETE | `/api/pins/{id}`          | Edit / delete (owner)                                   |
| POST / DELETE  | `/api/pins/{id}/save`     | Save to board / unsave (auth)                           |
| POST / DELETE  | `/api/pins/{id}/react`    | React / unreact (auth)                                  |


### Boards


| Method               | Path                        | Description             |
| -------------------- | --------------------------- | ----------------------- |
| POST                 | `/api/boards`               | Create board (auth)     |
| GET / PATCH / DELETE | `/api/boards/{id}`          | Get / edit / delete     |
| GET                  | `/api/boards/{id}/pins`     | Pins on a board (paged) |
| GET / POST           | `/api/boards/{id}/sections` | List / create sections  |


### Comments


| Method        | Path                       | Description                |
| ------------- | -------------------------- | -------------------------- |
| GET / POST    | `/api/pins/{id}/comments`  | List / add comment         |
| DELETE        | `/api/comments/{id}`       | Delete own comment         |
| POST / DELETE | `/api/comments/{id}/react` | React / unreact to comment |


### Search & Discover


| Method | Path                         | Description                                               |
| ------ | ---------------------------- | --------------------------------------------------------- |
| GET    | `/api/search/pins?q=`        | Search by title/description/alt **and topic** (+ aliases) |
| GET    | `/api/search/suggestions?q=` | Autocomplete chips                                        |
| GET    | `/api/topics`                | All topics                                                |
| GET    | `/api/topics/{slug}/pins`    | Pins in a topic                                           |
| GET    | `/api/explore`               | Random topic tiles for Explore                            |
| GET    | `/api/health`                | Health check                                              |


---

## 7. Application Flows

**Auth**

1. User clicks *Log in / Sign up* → `AuthModal`.
2. Frontend POSTs to `/api/auth/{signup,login}` → receives JWT → stored in `localStorage`.
3. `AuthProvider` calls `/api/auth/me` to hydrate the user; the JWT is attached to every request.

**Browse feed (infinite scroll)**

1. `PinFeed` uses TanStack Query `useInfiniteQuery` → `GET /api/pins/feed?cursor=`.
2. An `IntersectionObserver` sentinel fetches the next page as you scroll.
3. Each `PinCard` shows the image with its **dominant-color placeholder** while loading.

**Save a pin to a board**

1. Hover a pin → click **Save** → `BoardPickerModal` opens.
2. Lists the user's boards (or *Create board*). Selecting one → `POST /api/pins/{id}/save {board_id}`.
3. A toast confirms "Saved to ".

**Create a pin (image pipeline)**

1. `/create` → drag/drop or pick an image, add title/description/link/board → **Publish**.
2. Frontend POSTs `multipart/form-data` to `/api/pins`.
3. Backend (`services/images.py`) validates with **Pillow**, normalizes mode, downscales to ≤1400px, extracts the **dominant color**, saves as JPEG with a UUID filename, and stores metadata. If a board was chosen, a `save` row is also created.

**Pin closeup**

- `/pin/:id` shows the image (with AI-modified badge + expand), React/Share/⋯/Save actions, author, description, **comments** (add/list), and **related pins**. The ⋯ menu downloads the image / copies an embed code.

**Search**

- Header search → `/search?q=` → `SearchView` shows filter chips + masonry results. The backend matches the query against pin text **and** topic names, with an alias map (e.g. `dress`→Fashion, `recipe`→Food).

---

## 8. Feature List

✅ Email/password auth (JWT) · ✅ Home masonry feed + infinite scroll · ✅ Pin closeup · ✅ Create/upload pin (Pillow processing) · ✅ Boards + sections + save-to-board picker · ✅ Comments · ✅ Reactions (like) · ✅ Follow/unfollow · ✅ Profiles (Created/Saved tabs) · ✅ Search (text + topic + aliases) · ✅ Explore/topics · ✅ Image download · ✅ Pinterest-accurate UI (left rail, search-first header, account menu, Updates/Messages flyouts, ⋯ actions menu).

---

## 9. Setup & Run

**Prerequisites:** Python 3.13, Node 20+.

### Backend

```bash
cd backend
python3.13 -m venv .venv
./.venv/bin/pip install -r requirements.txt
./.venv/bin/python -m seed.seed          # seed demo data (downloads images)
./.venv/bin/uvicorn app.main:app --reload --port 8000
```

Backend runs at **[http://localhost:8000](http://localhost:8000)** (docs at `/docs`).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **[http://localhost:3000](http://localhost:3000)**.

> Config: `frontend/.env.local` → `NEXT_PUBLIC_API_URL=http://localhost:8000`. Backend secret/JWT settings live in `backend/.env`.

---

## 10. Seed Data

`python -m seed.seed` builds a demo dataset (downloads ~65 sample images from picsum.photos, processes each through Pillow):


| Table     | Rows (approx.) |
| --------- | -------------- |
| users     | 5              |
| topics    | 12             |
| pins      | 60+            |
| boards    | 15+            |
| saves     | 100+           |
| comments  | 70+            |
| reactions | 170+           |
| follows   | ~9             |


**Demo login:** `alex@demo.com` / `password123` (also sara/mike/nina/leo @demo.com, same password).

---

## 11. Demo Script

A suggested 2–3 minute walkthrough:

1. **Logged-out** → land on `/`, scroll the masonry feed (infinite scroll), click **Log in** → `alex@demo.com / password123`.
2. **Logged-in chrome** → point out the left icon rail, search-first header, avatar **account menu**, and the **Updates** bell flyout.
3. **Search** → type a topic and hit enter. Working terms: `dress`, `travel`, `wallpaper`, `recipes`, `makeup`, `bedroom`, `nature`, `fashion`, `home decor`, `mountain`, `cozy`, `modern`…
4. **Pin closeup** → open any pin: React (heart), add a **comment**, open the **⋯** menu → **Download image** (real download), **Get embed code** (copies to clipboard).
5. **Save** → hover a pin → **Save** → pick a board (or create one) → toast confirms.
6. **Create** → `/create` → drag in an image, add a title + board → **Publish** → lands on the new pin (image was resized + dominant-color extracted server-side by Pillow).
7. **Profile** → click your avatar → profile with **Created/Saved** tabs and board cards; open a **board**.

---

## 12. Notes & Limitations

- **By design (demo):** visual/voice search, notifications/messages content, collages, "convert to business", and multi-account are intentionally non-functional (they show a toast or an empty-state flyout, matching Pinterest's UI).
- **Reactions** are stored with a type but the UI currently exposes a single "like".
- **Search** is `LIKE`/topic-based (not full-text relevance ranking); good enough for the demo.
- **Storage** is local: images on disk, data in one SQLite file — zero external services required.

```

```

