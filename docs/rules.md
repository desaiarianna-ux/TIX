# Validation + Scoring Rules

## Validator categories
- **Errors:** required field missing/invalid, future dates, hard rule-required fields.
- **Warnings:** suspicious plate/location format, unresolved street, unknown violation code, scam signals.
- **Notes:** contextual defense opportunities (photos, signage visibility, in-car context, rule notes).

## Scoring
- Start pay=70, fight=30
- Each error: pay -25, fight +25
- Each warning: pay -10, fight +10
- Each note: fight +5
- Clamp to 0..100

## Verdict mapping
- `likely_invalid`: fight >= 75 OR errors >= 2
- `possibly_invalid`: fight 45..74 OR warnings >= 2
- `likely_valid`: otherwise
