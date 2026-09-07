# Character Folio

A standalone, browser-based AD&D 2nd Edition character record. The application uses React, TypeScript and Vite and builds into ordinary static HTML, JavaScript, CSS, images and fonts. It does not need an application server, account provider, API key, database, or server-side runtime in production.

## Features

- Two character-sheet pages with editable statistics, inventory, supplies, treasure, magic and notes.
- A map grid with drawing and stroke undo.
- A multipage spellbook with nine spells per page, seven individually editable detail lines per spell, and shared spellcasting level and slots/memory.
- A Bag of Holding with editable bag details and 25 inventory rows.
- Locally bundled historical serif font with automatic field fitting.
- Fit-to-page and enlarged editing views, browser printing, JSON export/import and automatic browser-local saving.

## Before changing the website address

**Export your character from the existing website before moving to a new domain, port, or protocol.** Browser storage belongs to an origin, so the new website cannot read the old website's saves. Open the new website and import the exported JSON. The file contains the character pages, spellbook, bag and map data together.

The storage key remains `character-folio-v1`; existing exports are compatible. There is no cloud synchronization. Different browsers and devices have separate saves. Clearing site data or using private browsing can lose saves, so keep exported backups. Multiple people can use the same hosted application, but their data stays in their own browsers. Hosting access control, if wanted, must be configured at the web server or reverse proxy.

## Build locally

Install Node.js 22.13 or newer (Node 22 LTS is used by the Docker build), with npm. From the project directory:

```sh
npm ci
npm run lint
npm run build
```

`npm ci` installs the exact lockfile dependencies, including build tools. Do not use `--omit=dev` for this step. `npm run build` runs TypeScript validation before creating `dist/`.

Useful commands:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local development, normally at `http://127.0.0.1:5173` |
| `npm run typecheck` | TypeScript validation without building |
| `npm run lint` | Check the application source |
| `npm run build` | Produce the production `dist/` folder |
| `npm start` | Local preview of `dist/`, normally at `http://127.0.0.1:4173` |

Use the actual address printed in the terminal if a port is occupied. The development and preview commands bind to loopback. They are for local verification, not production serving.

## What to deploy

Upload **the contents of `dist/`**, including all subdirectories, to a web server's document root. `index.html` must be directly in that root. Do not upload the repository, `.git`, `node_modules`, source files, or environment files.

A production server only needs to serve static files. PHP, Node, WebSockets, serverless functions, and a database are not required. Serve `.js` as JavaScript and `.css` as CSS. Do not open `index.html` directly with `file://`; use a web server.

**Use HTTPS on a public server.** Some browser features used by the app, such as secure UUID generation, require a secure context; localhost is permitted for local development. Configure your domain's DNS and TLS certificate before normal use.

## Option 1: Nginx on a Linux server

These commands assume a Debian/Ubuntu-style Nginx installation. Replace `example.com`, `user`, and `server` with your own values. Run build commands on your development machine or CI runner.

1. Build locally:

   ```sh
   npm ci
   npm run build
   ```

2. On the server, install Nginx if needed and create a release directory:

   ```sh
   sudo apt update
   sudo apt install nginx
   sudo mkdir -p /var/www/character-folio/releases/initial
   ```

3. Upload the contents of `dist/` with your SFTP client to a staging directory such as `/home/user/character-folio-upload/`. On the server, copy that upload into the release directory:

   ```sh
   sudo cp -a /home/user/character-folio-upload/. /var/www/character-folio/releases/initial/
   sudo chown -R root:root /var/www/character-folio/releases/initial
   sudo find /var/www/character-folio/releases/initial -type d -exec chmod 755 {} \;
   sudo find /var/www/character-folio/releases/initial -type f -exec chmod 644 {} \;
   sudo ln -s /var/www/character-folio/releases/initial /var/www/character-folio/current
   ```

   The `current` symlink should not exist before this initial setup. Do not point the document root at your source checkout.

4. Copy `deploy/nginx.conf` to `/etc/nginx/sites-available/character-folio`, edit `server_name example.com;` to your actual domain, then enable it:

   ```sh
   sudo ln -s /etc/nginx/sites-available/character-folio /etc/nginx/sites-enabled/character-folio
   sudo nginx -t
   sudo systemctl reload nginx
   ```

   If your distribution uses `conf.d` instead of `sites-available`, put the configuration in its configured include directory instead. Avoid duplicating an existing server block for the same domain.

5. Enable HTTPS with your preferred certificate manager or TLS reverse proxy. On a standard Ubuntu/Debian host using Certbot, one common setup is:

   ```sh
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d example.com
   sudo certbot renew --dry-run
   ```

   Your DNS must point to the server, and ports 80 and 443 must be reachable for this setup. The supplied configuration is an HTTP starting point; TLS must be added before public use.

### Updating and rolling back

Build a fresh `dist/`, upload it into a new release directory, and check its `index.html` and assets before switching. Keep the preceding release for rollback. For example, after uploading a release to `/var/www/character-folio/releases/release-2`:

```sh
sudo ln -s /var/www/character-folio/releases/release-2 /var/www/character-folio/current-next
sudo mv -Tf /var/www/character-folio/current-next /var/www/character-folio/current
```

Both `current` and `current-next` are release symlinks, not real directories. The temporary symlink must not already exist. To roll back, repeat with the previous release path. A same-origin deployment preserves browser-local character data.

The provided configuration avoids stale HTML and artwork, while allowing long caching for hashed files in `assets/`. For uninterrupted long-lived sessions, retain old hashed assets in the new release or ask users to reload after an update.

## Option 2: Apache or shared hosting

1. Run `npm ci` and `npm run build` on your computer.
2. Using SFTP or your hosting control panel, upload everything **inside** `dist/` to the website's public directory, commonly `public_html` or `htdocs`.
3. Ensure `index.html` is recognized as a directory index and enable HTTPS in the hosting control panel.
4. Visit the site's HTTPS address and verify the deployment checklist below.

This application uses tabs on one page, so no history-routing rewrite or `.htaccess` SPA fallback is needed. Standard static-file support is sufficient. Disable directory listing at the host if it is enabled.

### Hosting in a subdirectory

You can place the built files at a path such as `https://example.com/folio/`. Keep the trailing slash when linking to the app. The build uses relative asset URLs, including the sheet artwork and font, so the same `dist/` works at a domain root or in a subdirectory. Keep all files and folders together.

Storage is scoped to the origin, not the path. Two copies under different paths on the same domain share the same character storage key. Use separate subdomains if you want separate saves.

## Option 3: Docker

A multi-stage `Dockerfile` builds the application and serves only static files with Nginx. From the project root:

```sh
docker build -t character-folio:local .
docker run -d --name character-folio --restart unless-stopped -p 127.0.0.1:8080:80 character-folio:local
```

Test locally at `http://localhost:8080`. On a public server, put your HTTPS reverse proxy in front of `127.0.0.1:8080`. If the proxy itself runs in Docker, connect the two containers on a Docker network and proxy to `character-folio:80` instead of its own loopback address.

No data volume is needed: the container stores no character records. Rebuilding or replacing the container does not delete browser saves. Keep the same public origin and maintain user exports. The Docker build requires network access to download npm packages and base images; the running static site does not need those services.

For updates, build a separately tagged image and replace the running container during your deployment window. Keep the prior image tag for rollback. Pin base image digests if your release process requires fully reproducible container base layers.

## Deployment checklist

- Open the final HTTPS URL and check that all four sheet images and the fitted font load.
- Enter a temporary value, reload, and confirm it persists.
- Switch between Character sheet pages, Spellbook, and Bag of Holding.
- Verify spellbook page navigation and shared casting level/slots.
- Export a backup; import it in another browser and confirm the data is present.
- Check phone editing with Fit whole sheet / Enlarge to edit.
- Check print preview: Character sheet prints both pages; Spellbook prints every spell page; Bag of Holding prints its sheet.

The static build, TypeScript and application lint checks are validated locally. The included web-server and Docker configurations must be tested on your own host; they have not been provisioned on your server.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Blank page | Check the browser console and network requests. Confirm the complete `dist/` contents were uploaded and `.js` files have the correct content type. |
| Missing artwork in a subdirectory | Use the directory URL with a trailing slash and upload all artwork alongside `index.html`. |
| Old content after an update | Reload the page; check CDN/server cache rules for `index.html` and non-hashed images. |
| Save did not follow the new domain | Export from the old origin and import at the new one. Browsers intentionally isolate storage by origin. |
| Cannot save | Browser storage may be disabled or full. Export a JSON backup before leaving the page. |
| Adding records fails over HTTP | Use HTTPS, or localhost for local testing. |

## Source layout and customization

- `app/page.tsx`: main tabs, character page 1, data storage and import/export.
- `app/character-page-two.tsx`: inventory, supplies, map drawing and page 2.
- `app/spellbook.tsx`: spell pages and shared spell settings.
- `app/bag-of-holding.tsx`: bag details and inventory rows.
- `app/fitted-entry.tsx`: font fitting for inputs.
- `app/globals.css`: layout, typography, responsive and print styles.
- `app/main.tsx` and `index.html`: standalone browser entry point.
- `public/`: original sheet artwork, favicon and font license.
- `deploy/`: Nginx configuration examples.

Fields are positioned over the original images in native image coordinates. Preserve each image's dimensions when adjusting field positions. All game values are manually editable; there is no automatic rules engine. The bundled font's license is in `public/fonts/OFL.txt`. Check that you have the necessary rights to distribute the supplied sheet artwork before publishing it publicly.
