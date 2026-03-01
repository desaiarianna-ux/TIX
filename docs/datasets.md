# Dataset Used

This MVP ingests NYC Open Data parking violations dataset:

- **Name:** Parking Violations Issued - Fiscal Year 2024
- **Dataset ID:** `nc67-uf89`
- **Official source:** https://data.cityofnewyork.us/City-Government/Parking-Violations-Issued-Fiscal-Year-2024/nc67-uf89
- **CSV endpoint used by ingest script:** `https://data.cityofnewyork.us/resource/nc67-uf89.csv?$limit=50000`

## Fallback

If the live download fails, ingestion uses `data/sample.csv` so the app remains demoable.
