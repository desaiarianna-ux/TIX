# Tix (Hackathon-ready MVP)

Tix helps answer:
1. **Is this ticket even valid?**
2. **Do I have to pay it?**
3. **Help me fight it**

## Run locally
# TIX MVP

Small Next.js MVP that checks whether a NY ticket/summons number **looks valid** using:

1. format heuristics, and
2. exact lookup against an ingested NYC Open Data dataset in SQLite.

## I just want this to work (copy/paste)

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

## Notes

- If data isn't loaded, app shows: `Dataset not loaded. Run npm run ingest`
- Works offline using bundled sample files in `/data`
- Not legal advice. Verify with official agency.
Open http://localhost:3000 and click **Use demo sample** then **Check**.

## One-command setup helper

```bash
npm run setup
npm run dev
```

`setup` runs install + ingest for you.

## Demo values

These are included in fallback sample data and are good for a quick demo:

- Ticket: `1234567890` Plate: `ABC1234` Date: `2024-02-10`
- Ticket: `0000111122`
- Ticket: `98765432101`

## How it works

- `scripts/ingest.ts` downloads NYC Open Data CSV (`nc67-uf89`) and normalizes rows into `db.sqlite` table `tickets_normalized`.
- If download fails, it falls back to `data/sample.csv`.
- `POST /api/validate` applies format checks + dataset lookup and returns verdict, confidence, signals, and matches.

## API payload

Request:

```json
{
  "ticketNumber": "1234567890",
  "plate": "ABC1234",
  "issueDate": "2024-02-10"
}
```

Response shape:

```json
{
  "verdict": "valid",
  "confidence": 100,
  "matches": [],
  "signals": [],
  "nextSteps": []
}
```

## Disclaimer

This project is for hackathon/demo use only and is **not legal advice**. Always verify with official agencies.
