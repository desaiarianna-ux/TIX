# Datasets Used

## Primary NYC open data source
- **Name:** Parking Violations Issued - Fiscal Year 2024
- **Dataset ID:** `nc67-uf89`
- **URL:** https://data.cityofnewyork.us/City-Government/Parking-Violations-Issued-Fiscal-Year-2024/nc67-uf89
- **CSV API endpoint:** https://data.cityofnewyork.us/resource/nc67-uf89.csv?$limit=50000
- **Columns consumed:** `summons_number`, `issuing_agency`, `issue_date`, `plate_id`, `violation_code`, `fine_amount`

## Offline bundled fallbacks
- `data/sample.csv` (ticket rows fallback)
- `data/sample_violation_codes.csv` (rule requirements by violation code)
- `data/sample_streets.csv` (light street reference table for location checks)
- `data/sample_tickets.csv` (demo-only optional realism examples)

The app is designed to work even if remote download fails by using local sample fallbacks.
# Dataset Used

This MVP ingests NYC Open Data parking violations dataset:

- **Name:** Parking Violations Issued - Fiscal Year 2024
- **Dataset ID:** `nc67-uf89`
- **Official source:** https://data.cityofnewyork.us/City-Government/Parking-Violations-Issued-Fiscal-Year-2024/nc67-uf89
- **CSV endpoint used by ingest script:** `https://data.cityofnewyork.us/resource/nc67-uf89.csv?$limit=50000`

## Fallback

If the live download fails, ingestion uses `data/sample.csv` so the app remains demoable.
