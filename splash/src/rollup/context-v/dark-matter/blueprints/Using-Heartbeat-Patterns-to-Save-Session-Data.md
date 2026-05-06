---
from: dark-matter
from_path: blueprints/Using-Heartbeat-Patterns-to-Save-Session-Data.md
---
<!-- Rolled up from dark-matter/context-v/blueprints/Using-Heartbeat-Patterns-to-Save-Session-Data.md. Edit at the source, not here. Re-run `pnpm rollup:sync` to refresh. -->

# Using Heartbeat Patterns to Save Session Data

A lightweight, dependency-free approach to tracking user session duration using periodic heartbeats.

## Overview

The heartbeat pattern solves a common problem: **how do you know when a user stopped viewing your content?**

Traditional approaches like `beforeunload` events are unreliable, especially on mobile. The heartbeat pattern instead sends periodic "I'm still here" signals, and when those signals stop, you know the session ended.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Heartbeat Session Tracking                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   User submits email for access                                              │
│           │                                                                  │
│           ▼                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  POST /api/verify-temp-access                                        │   │
│   │                                                                      │   │
│   │  1. Create NocoDB record with sessionStartTime                       │   │
│   │  2. Store record ID in cookie (session_record_id)                    │   │
│   │  3. Set auth cookie                                                  │   │
│   │  4. Redirect to confidential content                                 │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│           │                                                                  │
│           ▼                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  Confidential Page + SessionHeartbeat Component                      │   │
│   │                                                                      │   │
│   │  ┌─────────────────────────────────────────────────────────────┐    │   │
│   │  │  Client-side JavaScript (vanilla, no dependencies)          │    │   │
│   │  │                                                             │    │   │
│   │  │  • Read session_record_id from cookie                       │    │   │
│   │  │  • Send initial heartbeat on page load                      │    │   │
│   │  │  • setInterval: ping every 3 minutes                        │    │   │
│   │  │  • Pause when document.hidden (tab not visible)             │    │   │
│   │  │  • Resume + immediate ping when tab visible again           │    │   │
│   │  │  • sendBeacon on beforeunload (best effort)                 │    │   │
│   │  └─────────────────────────────────────────────────────────────┘    │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│           │                                                                  │
│           │ Every 3 minutes                                                  │
│           ▼                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  POST /api/session-heartbeat                                         │   │
│   │                                                                      │   │
│   │  1. Read session_record_id from cookie                               │   │
│   │  2. PATCH NocoDB record: sessionEndTime = now()                      │   │
│   │  3. Return success                                                   │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   When heartbeats stop → sessionEndTime freezes at last known time          │
│   Session duration = sessionEndTime - sessionStartTime                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Why Heartbeat Over Other Approaches?

| Approach | Reliability | Notes |
|----------|-------------|-------|
| `beforeunload` event | Poor | Often blocked on mobile, doesn't fire on crashes |
| `unload` event | Poor | Same issues as beforeunload |
| `visibilitychange` | Medium | Good for pause/resume, but doesn't catch tab close |
| **Heartbeat** | **High** | Works regardless of how user leaves |
| WebSocket ping | High | Overkill for simple session tracking |

The heartbeat pattern's key insight: **you don't need to know exactly when the user left, just when they were last seen.**

## Implementation Details

### 1. Session Creation (verify-temp-access.ts)

When user submits email:

```typescript
// Create session in NocoDB
const result = await createEmailAccessSession(normalizedEmail);

// Store record ID for heartbeat tracking (client-readable cookie)
if (sessionRecordId) {
  cookies.set('session_record_id', String(sessionRecordId), {
    httpOnly: false, // Client needs to read this
    secure: import.meta.env.PROD,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
}
```

### 2. Heartbeat Endpoint (session-heartbeat.ts)

Simple endpoint that updates the session's "last seen" time:

```typescript
export const POST: APIRoute = async ({ cookies }) => {
  const sessionRecordId = cookies.get('session_record_id')?.value;

  if (!sessionRecordId) {
    return new Response(
      JSON.stringify({ success: false, error: 'No session' }),
      { status: 400 }
    );
  }

  const result = await updateSessionHeartbeat(parseInt(sessionRecordId, 10));

  return new Response(
    JSON.stringify({ success: result.success }),
    { status: result.success ? 200 : 500 }
  );
};
```

### 3. NocoDB Update Function (nocodb.ts)

```typescript
export async function updateSessionHeartbeat(
  recordId: number
): Promise<{ success: boolean; error?: string }> {
  const url = new URL(
    `/api/v3/data/${config.baseId}/${NOCODB_TABLES.emailAccess}/records`,
    config.baseUrl
  );

  const response = await fetch(url.toString(), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'xc-token': config.apiKey,
    },
    body: JSON.stringify([{
      id: recordId,
      sessionEndTime: new Date().toISOString(),
    }]),
  });

  return { success: response.ok };
}
```

### 4. Client-Side Heartbeat (SessionHeartbeat.astro)

Vanilla JavaScript, no dependencies:

```javascript
(function() {
  const HEARTBEAT_INTERVAL = 3 * 60 * 1000; // 3 minutes
  let heartbeatTimer = null;
  let isPageVisible = true;

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop().split(';').shift();
    }
    return null;
  }

  async function sendHeartbeat() {
    const sessionRecordId = getCookie('session_record_id');
    if (!sessionRecordId) return;

    try {
      await fetch('/api/session-heartbeat', {
        method: 'POST',
        credentials: 'same-origin',
      });
    } catch (error) {
      console.error('Heartbeat failed:', error);
    }
  }

  function startHeartbeat() {
    sendHeartbeat(); // Initial heartbeat
    heartbeatTimer = setInterval(() => {
      if (isPageVisible) sendHeartbeat();
    }, HEARTBEAT_INTERVAL);
  }

  // Pause when tab hidden, resume when visible
  document.addEventListener('visibilitychange', () => {
    isPageVisible = !document.hidden;
    if (isPageVisible) sendHeartbeat(); // Immediate ping on return
  });

  // Best-effort final heartbeat on page unload
  window.addEventListener('beforeunload', () => {
    const sessionRecordId = getCookie('session_record_id');
    if (sessionRecordId && navigator.sendBeacon) {
      navigator.sendBeacon('/api/session-heartbeat');
    }
  });

  // Start on DOM ready
  document.addEventListener('DOMContentLoaded', startHeartbeat);
})();
```

## NocoDB Schema

The `emailAccess` table stores sessions:

| Field | Type | Description |
|-------|------|-------------|
| `emailOfAccessor` | Text | User's email address |
| `sessionStartTime` | DateTime | When session was created |
| `sessionEndTime` | DateTime | Rolling "last seen" timestamp |

**Calculating session duration:**

```javascript
const durationMs = new Date(sessionEndTime) - new Date(sessionStartTime);
const durationMinutes = Math.round(durationMs / 60000);
```

## Multiple Sessions Per User

Each email submission creates a new record, so the same user can have many sessions:

```
| emailOfAccessor     | sessionStartTime     | sessionEndTime       |
|---------------------|----------------------|----------------------|
| joe@example.com     | 2025-12-25T10:00:00 | 2025-12-25T10:45:00 | (45 min)
| joe@example.com     | 2025-12-25T14:30:00 | 2025-12-25T14:42:00 | (12 min)
| jane@company.com    | 2025-12-25T11:00:00 | 2025-12-25T11:33:00 | (33 min)
```

Query all sessions for a user:

```typescript
const sessions = await fetchEmailAccessSessions({ email: 'joe@example.com' });
```

## Configuration Options

The `SessionHeartbeat` component accepts props:

```astro
<!-- Default: 3 minute interval -->
<SessionHeartbeat />

<!-- Custom interval (in milliseconds) -->
<SessionHeartbeat interval={60000} /> <!-- 1 minute -->

<!-- Enable debug logging -->
<SessionHeartbeat debug={true} />
```

## Browser APIs Used

All native, no polyfills needed for modern browsers:

| API | Purpose | Browser Support |
|-----|---------|-----------------|
| `fetch()` | HTTP requests | All modern browsers |
| `setInterval()` | Periodic execution | Universal |
| `document.cookie` | Cookie access | Universal |
| `navigator.sendBeacon()` | Reliable unload requests | All modern browsers |
| `document.visibilityState` | Tab visibility | All modern browsers |
| `document.hidden` | Tab hidden check | All modern browsers |

## Usage

1. **Add to any protected page:**

```astro
---
import SessionHeartbeat from '@components/auth/SessionHeartbeat.astro';
---

<Layout>
  <SessionHeartbeat />
  <!-- Your content -->
</Layout>
```

2. **Ensure session creation stores record ID** (already implemented in `verify-temp-access.ts`)

3. **Query session data from NocoDB** for analytics:

```typescript
import { fetchEmailAccessSessions } from '@lib/nocodb';

// All sessions
const allSessions = await fetchEmailAccessSessions();

// Sessions for specific user
const userSessions = await fetchEmailAccessSessions({
  email: 'joe@example.com'
});

// Calculate total time spent
const totalMinutes = userSessions.reduce((sum, session) => {
  const start = new Date(session.fields.sessionStartTime);
  const end = new Date(session.fields.sessionEndTime || new Date());
  return sum + (end - start) / 60000;
}, 0);
```

## Limitations

1. **3-minute granularity**: Session duration is accurate to ~3 minutes (the heartbeat interval)
2. **Requires cookies**: Won't work if user blocks cookies
3. **Single page**: Each page needs the component; doesn't track navigation between pages
4. **Network dependent**: Heartbeats fail silently if offline

## Future Enhancements

- **Page tracking**: Add `currentPage` field to track which pages were viewed
- **Activity detection**: Only send heartbeat if user has interacted recently
- **Adaptive interval**: Reduce frequency after extended inactivity
- **Offline queue**: Store heartbeats locally if offline, sync when back online

## Files Reference

| File | Purpose |
|------|---------|
| `src/pages/api/verify-temp-access.ts` | Creates session, stores record ID |
| `src/pages/api/session-heartbeat.ts` | Receives heartbeat pings |
| `src/components/auth/SessionHeartbeat.astro` | Client-side heartbeat script |
| `src/lib/nocodb.ts` | `updateSessionHeartbeat()` function |
| `src/pages/portfolio/confidential/index.astro` | Example usage |
