# Character Folio

Mobile-friendly, manually editable AD&D 2nd Edition character sheet based on the supplied reference.

## Use

Edit any field. Data is saved automatically in this browser. Export JSON backups to transfer characters between devices; import replaces the current sheet after confirmation. Removed entries and character replacement can be undone. Print uses a paper-friendly layout. Expand personal details before printing to include them.

All ability scores, saving throws, armor values, and modifiers are manual. No game rules or derived statistics override entries. Add arbitrary sections for spells, inventory, or campaign rules. Source is fully editable in app/page.tsx and app/globals.css.

## Development

Use Node 22.13 or newer. Run `npm install` and `npm run dev`. Run `npm run build` for production and `npx tsc --noEmit` for type validation.

## Storage

No character data is sent to a server. Browser storage is scoped to the website address and device; it is not cloud synchronization. Export before clearing browser data or switching addresses. Imports are size-limited and schema-validated before replacing data.

## Validation

Production build and TypeScript checks pass. Application files pass lint. The generated component catalog has pre-existing lint findings. Responsive layouts target phone, tablet, desktop, and print; interactive browser QA was not performed.
