# Livo (RentMaster)

A full-stack rental property marketplace connecting tenants, agents, and admins. Tenants browse listings and inquire about properties; agents post and manage listings and respond to inquiries; admins oversee users and platform activity.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| Backend | Express (Node.js), TypeScript, run via `tsx` |
| Database | SQLite (`better-sqlite3`) |
| Auth | JWT (`jsonwebtoken`) + password hashing (`bcryptjs`) |
| File Uploads | `multer` |
| Animation | `motion` (Framer Motion) |
| Icons | `lucide-react` |

The frontend and backend run as a **single process**: `server.ts` starts an Express server and, in development, mounts Vite's dev middleware directly onto it — so one `npm run dev` command serves both the API and the React app on the same port (`3000`).

---

## Project Structure

```
livo/
├── server.ts                  # Express server: routes, auth, DB schema, file uploads
├── rentmaster.db              # SQLite database file
├── uploads/                   # Uploaded property photos (created automatically, git-ignored)
├── src/
│   ├── main.tsx                # React entry point
│   ├── App.tsx                 # Top-level routing by auth state and role
│   ├── index.css               # Tailwind import + brand color theme
│   ├── types.ts                 # Shared TypeScript interfaces
│   ├── hooks/
│   │   └── useAuth.ts            # Login/logout/session state, backed by JWT in localStorage
│   ├── components/
│   │   ├── Navbar.tsx             # Top navigation bar, shown on all dashboards
│   │   ├── PropertyCard.tsx       # Listing card (image, price, amenities, inquire button)
│   │   ├── ChatModal.tsx          # In-app messaging between tenant and agent
│   │   ├── NotificationCenter.tsx # Bell icon dropdown showing unread notifications
│   │   └── ErrorBoundary.tsx      # Catches render errors app-wide
│   └── pages/
│       ├── Login.tsx              # Login / registration screen
│       ├── TenantDashboard.tsx    # Browse listings, send inquiries, chat with agents
│       ├── AgentDashboard.tsx     # Create/edit/delete listings, manage inquiries, upload photos
│       └── AdminDashboard.tsx     # Manage user roles, oversee listings
├── .env.example                # Template for required environment variables
└── package.json
```

---

## Features by Role

### Tenant
- Browse all listings, filter by title/location and a max-price slider
- Send an inquiry on a listing with a message to the agent
- Chat with the agent once an inquiry is submitted
- Receive notifications when an inquiry's status changes

### Agent
- Create, edit, and delete their own listings
- Upload a property photo directly from their computer, or paste an image URL
- Toggle a listing's status (Available → Pending → Rented)
- View and respond to inquiries (Approve / Decline)
- Chat with tenants who inquired

### Admin
- View all registered users and change their role (tenant / agent / admin)
- Oversee listings across the whole platform

---

## Database Schema

SQLite tables, created automatically on first server start (`server.ts`):

| Table | Purpose | Key columns |
|---|---|---|
| `users` | Accounts | `email`, `password` (hashed), `displayName`, `role` |
| `listings` | Property listings | `title`, `price`, `location`, `amenities` (JSON string), `imageUrl`, `status`, `agentId` |
| `inquiries` | Tenant interest in a listing | `tenantId`, `agentId`, `propertyId`, `message`, `status` |
| `messages` | Chat messages tied to an inquiry | `senderId`, `receiverId`, `inquiryId`, `content` |
| `notifications` | Alerts for status changes / new inquiries | `recipient_id`, `sender_id`, `property_id`, `is_read` |

---

## API Endpoints

All endpoints are prefixed `/api`. Routes marked 🔒 require an `Authorization: Bearer <token>` header.

| Method | Route | Description |
|---|---|---|
| POST | `/auth/register` | Create a new account |
| POST | `/auth/login` | Log in, returns a JWT |
| GET 🔒 | `/auth/me` | Get the current logged-in user |
| GET | `/listings` | List all properties |
| POST 🔒 | `/listings` | Create a listing (agent/admin only) |
| PUT 🔒 | `/listings/:id` | Update a listing |
| DELETE 🔒 | `/listings/:id` | Delete a listing |
| POST 🔒 | `/upload` | Upload a property photo (multipart/form-data, field name `image`); returns `{ imageUrl }` |
| POST 🔒 | `/inquiries` | Submit an inquiry on a listing |
| GET 🔒 | `/inquiries` | List inquiries (filtered by role) |
| PUT 🔒 | `/inquiries/:id/status` | Approve or decline an inquiry |
| GET 🔒 | `/messages/:inquiryId` | Get chat messages for an inquiry |
| POST 🔒 | `/messages` | Send a chat message |
| GET 🔒 | `/notifications` | Get the current user's notifications |
| PUT 🔒 | `/notifications/:id/read` | Mark a notification as read |
| GET 🔒 | `/admin/users` | List all users (admin only) |
| PUT 🔒 | `/admin/users/:id/role` | Change a user's role (admin only) |

---

## Setup & Installation

**Requirements:** Node.js 18+ (20+ recommended), npm.

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# then fill in .env.local — see below

# 3. Run the app
npm run dev
```

The app runs at **http://localhost:3000**.

### Environment Variables (`.env.local`)

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Reserved for a Google Gemini integration; not currently wired into any feature |
| `APP_URL` | Base URL of the app (e.g. `http://localhost:3000`) |

> Note: the JWT signing secret is currently hardcoded in `server.ts` rather than pulled from an environment variable — acceptable for a coursework project, but a production app should move it to `.env`.

---

## Theming

Brand colors are defined once, in `src/index.css`, using a Tailwind v4 `@theme` block (`--color-brand-50` through `--color-brand-900`). Every component uses `brand-*` Tailwind classes rather than hardcoded hex codes, so the whole app's accent color can be changed by editing that single block.

---

## Image Uploads

Agents can attach a property photo two ways:
1. **Upload from device** — sent to `POST /api/upload` as `multipart/form-data`; the server saves it to `uploads/` and returns a URL like `/uploads/<timestamp>-<random>.jpg`.
2. **Paste a URL** — stored directly as the listing's `imageUrl`.

If a listing has no image at all, the UI falls back to a placeholder photo from `picsum.photos`, seeded by listing ID for consistency.

Accepted formats: JPEG, PNG, WEBP, GIF. Max file size: 5MB.

---

## Known Limitations

- JWT secret is hardcoded rather than environment-configured
- No automated tests
- `GEMINI_API_KEY` is present in the environment template but not yet used by any feature
- No pagination on listings or user lists (fine at coursework scale)
