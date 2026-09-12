# OurHomegroup – Hybrid MVP v0.3

Privacy-first recovery & peer-support meeting platform.

## Implemented in this iteration

| Feature | Status |
|---------|--------|
| Real `@livekit/components-react` `<LiveKitRoom>` + `VideoConference` | ✅ |
| Clerk auth + role-based LiveKit token claims | ✅ |
| Meeting schedule / list / detail + CRUD API | ✅ |
| ICS calendar export | ✅ |
| Attendance capture (join/leave) + basic reporting | ✅ |
| Multi-tenant organization scaffolding | ✅ |
| Hybrid LiveKit primary + Zoom fallback | ✅ |

## Quick start

```bash
npm install
cp .env.example .env.local
# Add Clerk + LiveKit keys
npm run dev
```

### Routes
- `/` – Landing (Clerk SignIn / UserButton)
- `/sign-in`, `/sign-up`
- `/dashboard` – Member view + upcoming meetings
- `/meetings` – Meeting list
- `/meetings/[id]` – Live hybrid room (LiveKit or Zoom)
- `/admin` – Organizations + attendance report
- `/api/meetings` – CRUD
- `/api/meetings/[id]?format=ics` – ICS download
- `/api/attendance` – join / leave
- `/api/livekit-token` – role-aware tokens

## Role mapping (LiveKit grants)
- `member` → publish + subscribe
- `moderator` / `admin` / `superadmin` → roomAdmin + full control
- Set role on the Clerk user via `publicMetadata.role`

## Data layer
In-memory store (`lib/store.ts`) with seed organization + meetings.
Swap to Prisma + Postgres (with RLS) for production multi-tenancy.

## Production checklist
1. Configure Clerk (Google / Microsoft / email)
2. Create LiveKit Cloud project → set env vars
3. Replace store with database
4. Add webhook receiver for LiveKit participant events (more accurate attendance)
5. Harden API routes with `auth()` checks
6. Optional: Zoom Server-to-Server OAuth for auto-created fallback meetings

## Budget path
- LiveKit Cloud free/paid tier for MVP
- Self-host LiveKit later for cost control at high concurrent volume
- Organization-tier pricing (capacity / concurrent rooms) recommended over pure minutes


## v0.3.1 additions
- **Create Meeting form** on `/admin` (full fields: name, schedule, provider, visibility, capacity, waiting room, Zoom URL)
- **Members list** with role badges and privacy-aware display (anonymous / hide email / hide last name)
- Seed members for Demo Recovery Collective
- `/api/members` list + create endpoints
