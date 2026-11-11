# Import: reading a backup back in (in V1: decided 2026-11-08)

Asked by the planner on 2026-11-08: should V1 ship a way to restore the records from a file?

**Decided 2026-11-08 (planner): yes, in V1, with photos (way A, the zip).**
- Reason: the later it is built, the more file versions and migrations it must handle; now is cheapest.
- The design below is approved as written:
  - a scratch database, the file's migrations replayed, one copy into the live database;
  - ids kept;
  - only into an empty app;
  - pre-rename files (`app: 'MoreCoffee'`) accepted.
- `expo-document-picker` is approved, but goes in **one native rebuild together with the other native changes**.
- The Restore row goes in 6b's My data, beside "Export everything". Design is asked how a row that only works on an empty app looks when there are records: hidden, or shown disabled (Round 23).
- Everything but the UI starts now, in parallel with Design.

**Built 2026-11-08, everything but the UI:**
- `src/data/backupFormat.ts`: the zip, parsing, checks, rebuild and copy. It has no Expo imports, so it runs under node.
- `src/data/backup.ts`: the picker, reading the file, restoring, and the photos.
- `photos.ts`: `originalBytes` and `restorePhoto`.
- "Export everything" writes the zip (`format: 2`).
- `npm run check:backup` (pre-commit):
  - round trip with a photo;
  - format 1 with `app: 'MoreCoffee'`;
  - a schema-5 file coming up through migration 6;
  - refused on a non-empty app, with nothing written;
  - 7 refusals.
- **The UI was built the same day** from Design Round 23 (25e–25g):
  - `RestoreSheet.js`: confirm, working with a photo meter, done (with a line when photos are missing), and the four refusals;
  - 6b shows "Restore from a backup" only on an empty app, otherwise a sentence under the block;
  - the export is named `Extract Press backup YYYY-MM-DD.zip`.
  - **Not built: 8n's "New phone? Restore a backup"**, because the first setup (8n) isn't built. It goes in with 8n.
- The scratch database is in memory (`:memory:`), so there is no file to clean up. Separate from the rename (`rename-plan.md`): Uryu accepted losing today's dogfood records, so this is about the store build, not about saving them.

## Why it matters

- **Today nothing reads an export back.** 6b's "Export everything" writes JSON and stops. "Export my cups" (CSV) is for spreadsheets.
- **A new phone**: the only route is an iCloud / Finder backup of the whole phone. It should work, because the database and `Documents/photos` are both in the backup (`data-model.md`, "WAL and backups"). But **nobody has tried a restore yet**, and it only covers "the same person moves the whole phone".
- **Not covered by any route today**: moving to a phone set up fresh, keeping a copy of your own records that you can put back, and recovering after deleting the app.
- 6b's mock has a **Backup** row ("Last saved today, 08:24"). The JSON export sits in its place as a stopgap (`todo.md` T-8).
- The product is local-first and the records are all it has. Shipping with no way to carry them is the gap.

## How the import would work

**1. Pick the file.** Profile → My data → a new row, "Restore from a backup", opens the iOS file picker.
- Needs **`expo-document-picker`**: one native module, so prebuild plus a rebuild.
- The other route, "Open in Extract Press" from Files or Mail, needs a document type in Info.plist and a URL handler. That is more work for V1, and the picker covers the same need.

**2. Check the file.**
- `app` is `'ExtractPress'`, **or `'MoreCoffee'`** (files from before the rename).
- `format` is known.
- `schema_version` is no newer than the app's.
- Anything else: a plain message, and nothing is written.

**3. Rebuild the records at the file's own schema, then let the migrations bring them up.**
- An export from schema 4 has schema 4's columns. Rather than a converter per version, the import:
  - creates a scratch database (`import.db`);
  - runs migrations 1…N (N = the file's version);
  - inserts the rows as they are;
  - then runs N+1…latest, exactly as an old install updating would.
- That way every past backfill runs as written (migration 3's Taste DNA replay, migration 6's café names).
- Then, in one transaction on the live database: `ATTACH` the scratch database, copy table by table in key order, `DETACH`, and delete the scratch file.
- `migrate.ts` needs a small change: "migrate up to version N".

**4. Which tables.**
- Copied: cups, bags, gear, places, products (if present), search_history, and the settings row (an `UPDATE` of row 1, which always exists).
- **`schema_migrations` is not copied**: the live database keeps its own.
- **Ids are kept.** Every link between tables is an id (`bag_id`, `brewer_id`, `place_id`), so keeping them keeps the links.
- **Not just cups / bags / gear / settings**: places has to come too, or every café cup loses its café. search_history is optional.

**5. After the import.** Bump the provider's version so every screen reloads; Taste DNA reads the restored cups and their stored `dna_change`.

## When records already exist: only into an empty app

| | |
|---|---|
| **Into an empty app only (recommended)** | "Empty" means no cups, bags, gear or places. If anything is there: "Restore works on an empty app. You have 12 cups here." Simple, and it can't destroy anything. It covers the cases that matter: a new phone, a reinstall, the rename. |
| Replace | Deletes what is there first. Dangerous unless there is a separate "Reset" (6b has one, not built). It could come later as Reset + Restore, two acts the user does on purpose. |
| Merge | The same cup could be in both: matching by time and bean is guessing, and the ids clash. Not for V1. |

**One catch**: when a store user opens a new phone, they may log a cup before thinking of restoring, and then restore is refused. The message should say so. Whether Restore also goes into the first setup is Design's call.

## Photos

Today's JSON has the photo **ids** only. The sizes:
- each kept photo is two files, the original (long side 1200) and the styled copy;
- the planner's estimate is about 25 MB a year of bag photos for both files together.
- **Only the originals need to travel**: the styled copy is remade from the original with `restylePhoto` (`photos.ts`, the same call `restyleAll` uses). That halves it to about **12 MB a year**.

| Way | For | Against |
|---|---|---|
| A. **One `.zip` file**: `backup.json` plus `photos/<id>.jpg` (originals) | One file to share and pick, as today. JPEGs are stored uncompressed (they don't compress), so building it is cheap. | Needs a zip library. `fflate` is pure JS: no native module, no rebuild. After 5 years it is about 60 MB built in memory, which is fine on these phones but worth testing at that size. |
| B. base64 inside the JSON | No new library | +33 % size. The whole file is parsed as one string, so a 50 MB JSON means a few hundred MB of memory at peak, and it gets worse every year. A photo error spoils the whole file. |
| C. Records only, no photos | Cheapest | After a restore every bag shows the placeholder. The photos are the user's own, and losing them on restore reads as broken. |

**My recommendation: A.** The format changes once (`format: 2`, with the zip as the file), and the import still accepts the old plain JSON (`format: 1`, no photos). "Export everything" then writes the zip. The CSV doesn't change.

Restoring a photo: unzip the originals to `Documents/photos/`, then restyle each one. A missing or broken photo leaves its bag with the placeholder; it does not stop the import.

## Effort

| Part | Estimate |
|---|---|
| File picker (`expo-document-picker`, prebuild, rebuild) | 0.5 h |
| Checks + "migrate up to N" + scratch database + copy | 1 day |
| Profile row and its states (choose, working, done, refused, error): **after Design** | 0.5 day |
| A round-trip check script (export → import → the same rows), run by the pre-commit hook like `check:schema` | 0.5 day |
| **Records only (way C)** | **about 2 days** |
| Photos in a zip (way A): writing it, reading it, restyling, failures | +1 day |
| **With photos (way A)** | **about 3 days**, plus testing on the phone with real photos |

## Should it be in V1: yes, way A

- **The product is "your coffee record, on your phone".** Without a way to carry the records, a user who changes phones depends on a whole-phone iCloud restore that nobody has tested, and a user who deletes the app loses everything with no way back. Reviews of local-first apps punish exactly this.
- **It turns 6b's Backup row into a real row**, not a stopgap: export, and now restore.
- **It is cheap now and more expensive later.** Today there is one export format and six migrations. Every month adds data that a later import must cope with.
- **Not "Backup saves by itself"** (6b's "Last saved today"). Automatic backup to iCloud Drive is a bigger thing, V1.1 at the earliest. Manual export plus restore is enough for V1.
- **Also test the iCloud restore** (Uryu, with a phone backup): if it works, the store text can say so. If not, the import is the only route.

**What Design draws**: the My data rows (Export everything / Restore from a backup); the confirm sheet ("Restore 214 cups, 9 bags, 31 photos from 8 Nov 2026?"); the refused, done and failed states. Possibly Restore in the first setup.
