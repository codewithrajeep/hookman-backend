# Hookman API Tests

Bruno collection for testing all Hookman backend endpoints.

## Setup

1. Copy environment templates:
```bash
cp environments/local.yml.example environments/local.yml
cp environments/production.yml.example environments/production.yml
```

2. Open Bruno → Open Collection → select this `api-tests` folder

3. Run requests in order:
   - auth/register
   - auth/login (saves token automatically)
   - api-keys/create-api-key (saves apiKey automatically)
   - endpoints/create-endpoint (saves endpointId automatically)
   - events/ingest-event (saves eventId automatically)
   - then test remaining endpoints