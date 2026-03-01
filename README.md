# Tix (Hackathon-ready MVP)

Tix helps answer:
1. **Is this ticket even valid?**
2. **Do I have to pay it?**
3. **Help me fight it**

## Run locally

```bash
npm install
npm run ingest
npm run dev
```

Open http://localhost:3000

## Demo flow

1. Click **Check my ticket**
2. On `/check`, click **Load demo**
3. Click **Next** → answer context questions → **Analyze ticket**
4. Review verdict + scores + best defenses
5. Click **Generate appeal** and use copy button

## Endpoints

- `POST /api/validate` → full validator/scoring/defense response
- `GET /api/health` → db readiness, table counts, last ingest timestamp

## Troubleshooting (common run errors)

### 1) Native SQLite package build issues (Windows)
- Make sure you are on **Node 20+** and clean install:
  ```bash
  rm -rf node_modules package-lock.json
  npm cache verify
  npm install
  ```
- If install still fails on `better-sqlite3`, install Visual Studio Build Tools (Desktop development with C++), then retry.

### 2) "Dataset not loaded. Run npm run ingest"
- Run:
  ```bash
  npm run ingest
  ```
- Then refresh `/check`.

### 3) API returns validation errors immediately
- This is expected if required ticket fields are blank (date/time/street/borough/violation code).
- Use the **Load demo** button for a known-good starting payload.

## Notes

- If data isn't loaded, app shows: `Dataset not loaded. Run npm run ingest`
- Works offline using bundled sample files in `/data`
- Not legal advice. Verify with official agency.
