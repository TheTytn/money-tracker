# Data format

The data file is JSON. The full structure will be defined later; until then the app uses this placeholder:

```json
{
  "version": 1,
  "createdAt": "2026-11-27T17:00:00.000Z",
  "updatedAt": "2026-11-27T17:00:00.000Z",
  "spendings": []
}
```

- `version`: schema version, used for migrations when the structure changes.
- `createdAt` / `updatedAt`: ISO 8601 timestamps in UTC.
- `spendings`: list of spending records (structure to be defined).

Default file name for new files: `money-tracker.json`.
