# Editable original character sheet

The original supplied 1706-1.jpg is displayed at its native 1146 by 1524 aspect ratio. Editable fields are positioned over its lines and boxes; the ability modifier cells use compact HTML labels to leave room for typed values. The source artwork is public/character-sheet.jpg. Field coordinates and behaviors are in app/page.tsx; screen and print styles are in app/globals.css.

Use Fit whole sheet to view the original layout. Enlarge to edit displays native-sized fields and allows horizontal scrolling on small screens. All fields are manual and save to this browser. JSON import/export transfers data between devices. The existing character-folio-v1 storage format is retained. Additional fields and existing overflow entries are available below the original sheet.

Run npm install, npm run dev, and npm run build with Node 22.13 or newer. Validate types with npx tsc --noEmit. Application lint uses npx oxlint app/page.tsx app/layout.tsx; generated components have existing lint findings.
