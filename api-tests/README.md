# Hookman API Tests

Bruno collection covering all Hookman backend endpoints with post-response scripts that automatically save tokens, API keys, and IDs to environment variables — no manual copy-pasting needed.

---

## Prerequisites

- [Bruno](https://usebruno.com) installed
- Hookman backend running locally or deployed on Render
- A [webhook.site](https://webhook.site) URL for testing event delivery

---

## Setup

### 1. Copy environment templates

```bash
cp environments/local.yml.example environments/local.yml
cp environments/production.yml.example environments/production.yml
```

### 2. Fill in base URLs

`environments/local.yml` — already set to `http://localhost:3000`, no changes needed.

`environments/production.yml` — already set to `https://hookman-backend.onrender.com`, no changes needed.

All other variables (token, apiKey, endpointId, eventId) are populated automatically by post-response scripts when you run the requests in order.

### 3. Open collection in Bruno

- Open Bruno
- Click **Open Collection**
- Navigate to this `api-tests/` folder and select it
- Select your environment (`local` or `production`) from the top right dropdown

---

## Request Order

Run requests in this exact order — each step depends on the previous one:

### Auth
| # | Request | What it does |
|---|---------|--------------|
| 1 | `auth/register` | Create a new user account |
| 2 | `auth/login` | Login and auto-save JWT to `{{token}}` |

### API Keys
| # | Request | What it does |
|---|---------|--------------|
| 3 | `api-keys/create-api-key` | Create API key and auto-save to `{{apiKey}}` |
| 4 | `api-keys/list-api-keys` | List all API keys for the user |

### Endpoints
| # | Request | What it does |
|---|---------|--------------|
| 5 | `endpoints/create-endpoint` | Register a webhook URL and auto-save ID to `{{endpointId}}` |
| 6 | `endpoints/list-endpoints` | List all registered endpoints |
| 7 | `endpoints/get-endpoint` | Get endpoint by `{{endpointId}}` |
| 8 | `endpoints/update-endpoint` | Update endpoint name |
| 9 | `endpoints/delete-endpoint` | Delete endpoint (cascades all events) |

> ⚠️ Run `delete-endpoint` last — deleting an endpoint removes all its events and delivery history.

### Events
| # | Request | What it does |
|---|---------|--------------|
| 10 | `events/ingest-event` | Send event using `{{apiKey}}` and auto-save ID to `{{eventId}}` |
| 11 | `events/list-events` | List all events for the user |
| 12 | `events/get-event` | Get event by `{{eventId}}` |

> ℹ️ After ingesting an event, the BullMQ worker immediately attempts delivery to your endpoint URL. Check [webhook.site](https://webhook.site) to confirm the webhook arrived.

### Delivery
| # | Request | What it does |
|---|---------|--------------|
| 13 | `delivery/list-attempts` | List all delivery attempts for `{{eventId}}` |
| 14 | `delivery/list-dead-letters` | List all permanently failed events |
| 15 | `delivery/get-dead-letter` | Get dead letter event by `{{eventId}}` |
| 16 | `delivery/replay-event` | Re-queue a dead letter event for delivery |

### Stats
| # | Request | What it does |
|---|---------|--------------|
| 17 | `stats/overall-stats` | Overall delivery metrics (total, delivered, failed, success rate) |
| 18 | `stats/endpoint-stats` | Per-endpoint metrics for `{{endpointId}}` |

---

## Auth Headers

| Route type | Header |
|------------|--------|
| JWT protected routes | `Authorization: Bearer {{token}}` (set via Auth tab in Bruno) |
| Event ingestion | `x-api-key: {{apiKey}}` (set via Headers tab) |

---

## Environment Variables

| Variable | Set by | Description |
|----------|--------|-------------|
| `baseUrl` | Manual (template) | Base URL of the API |
| `token` | `auth/login` script | JWT token for protected routes |
| `apiKey` | `api-keys/create-api-key` script | Full API key including `hm_` prefix |
| `endpointId` | `endpoints/create-endpoint` script | ID of the registered endpoint |
| `eventId` | `events/ingest-event` script | ID of the ingested event |

---

## Testing Against Production

Switch the environment dropdown in Bruno from `local` to `production`. All `{{variables}}` work the same way — just run the requests in order again against the production base URL.

> ℹ️ Production runs on Render free tier — first request may take 30-60 seconds if the server has spun down due to inactivity.

---

## Notes

- `environments/local.yml` and `environments/production.yml` are gitignored — they contain live tokens and keys that should never be committed
- Use the `.example` files as templates — they are safe to commit and contain no sensitive values
- If a request fails with `401 Unauthorized`, run `auth/login` again to refresh the token
- If `ingest-event` fails with `Invalid API key`, run `api-keys/create-api-key` again to get a fresh key