# Tafeng

Tafeng is a WebSSH workspace prototype designed for Cloudflare Workers. It is built with React, Vite, and TypeScript, with a reserved Rust SSH gateway for future real SSH/SFTP integration. It includes admin-password login, optional two-factor authentication, VPS connection management, a terminal workspace, file upload/download APIs, a text configuration editor, resource monitoring, process lists, multilingual UI, and global command history.

Chinese documentation: [README.md](./README.md)

## Features

- WebSSH terminal workspace with a macOS Terminal-like interface.
- Save VPS connection profiles: IP/domain, port, username, password, or private key.
- Admin-password login on the home page.
- Optional two-factor authentication setting.
- Chinese and English UI.
- File listing, text config editor, upload and download API placeholders.
- Upload API designed for files up to 10 GB.
- Live CPU, memory, swap, disk usage, and process list panels.
- Global command history across all VPS connections, up to 100000 entries.
- Cloudflare Worker + KV + R2 deployment structure.
- Reserved Rust gateway for real SSH/SFTP integration.

## Current Status

The project currently includes the frontend, Worker APIs, authentication, settings, connection management, command history, file APIs, and monitoring UI. Real SSH/SFTP protocol integration is isolated in [worker/sshBridge.ts](./worker/sshBridge.ts). The current implementation is a runnable development bridge.

Recommended paths for real SSH integration:

1. Implement Cloudflare Worker TCP Socket + SSH protocol support in `worker/sshBridge.ts`.
2. Use [rust-gateway](./rust-gateway) as the real SSH/SFTP gateway while keeping the Worker as the auth, static asset, and edge entry point.

## Project Structure

```text
tafeng/
├── src/                 # React + Vite + TypeScript frontend
├── worker/              # Cloudflare Worker APIs and WebSocket service
├── shared/              # Shared frontend/Worker types
├── rust-gateway/        # Reserved Rust backend gateway
├── public/              # Static assets
├── dist/client/         # Frontend build output
├── wrangler.toml        # Cloudflare Worker config
├── package.json         # Frontend and Worker scripts
└── LICENSE              # MIT License
```

## Requirements

- Node.js 18 or newer. Node.js 20+ is recommended.
- npm 9 or newer.
- A Cloudflare account.
- Wrangler CLI. This project includes `wrangler` in devDependencies, so you can use `npm run worker:dev` and `npm run worker:deploy`.
- Rust toolchain, only if you want to run or develop `rust-gateway/`.

## Local Development

Install dependencies:

```bash
npm install
```

Start the Vite frontend dev server:

```bash
npm run dev
```

Default frontend URL:

```text
http://localhost:5173/
```

Build the frontend and start the local Worker:

```bash
npm run build
npm run worker:dev
```

Default Worker URL:

```text
http://localhost:8787/
```

The local development admin password is:

```text
tafeng
```

Do not use the default password in production. Configure the `ADMIN_PASSWORD` secret instead.

## Cloudflare Resources

Tafeng needs two Cloudflare resources:

- KV Namespace: stores settings, sessions, VPS connection profiles, command history index, and command history entries.
- R2 Bucket: stores uploaded files or large-file transfer staging data.

### 1. Log In to Cloudflare

```bash
npx wrangler login
```

For headless server deployments, use a Cloudflare API Token:

```bash
export CLOUDFLARE_API_TOKEN="your-cloudflare-api-token"
```

The token needs permissions for Workers, KV, and R2.

### 2. Create KV Namespaces

Create the production KV namespace:

```bash
npx wrangler kv namespace create TAFENG_KV
```

Create the preview KV namespace:

```bash
npx wrangler kv namespace create TAFENG_KV --preview
```

Wrangler will output something similar to:

```toml
[[kv_namespaces]]
binding = "TAFENG_KV"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
preview_id = "yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy"
```

Copy `id` and `preview_id` into [wrangler.toml](./wrangler.toml):

```toml
[[kv_namespaces]]
binding = "TAFENG_KV"
id = "your-production-kv-id"
preview_id = "your-preview-kv-id"
```

### 3. Create R2 Buckets

Create the production bucket:

```bash
npx wrangler r2 bucket create tafeng-files
```

Create the preview bucket:

```bash
npx wrangler r2 bucket create tafeng-files-preview
```

Make sure [wrangler.toml](./wrangler.toml) matches the bucket names:

```toml
[[r2_buckets]]
binding = "TAFENG_FILES"
bucket_name = "tafeng-files"
preview_bucket_name = "tafeng-files-preview"
```

### 4. Set the Admin Password

Set a production admin password:

```bash
npx wrangler secret put ADMIN_PASSWORD
```

Enter your password when prompted.

Optional: set a session secret. The current code reserves `SESSION_SECRET` for future signed sessions or encrypted storage:

```bash
npx wrangler secret put SESSION_SECRET
```

## Build and Deploy

### 1. Type Check

```bash
npm run typecheck
```

### 2. Build the Frontend

```bash
npm run build
```

The frontend output is written to:

```text
dist/client/
```

### 3. Deploy the Worker

```bash
npm run worker:deploy
```

After deployment, Wrangler will print a Worker URL, for example:

```text
https://tafeng.your-subdomain.workers.dev
```

Open the URL and log in with the password configured through `ADMIN_PASSWORD`.

## Custom Domain

You can bind a custom domain in the Cloudflare Dashboard:

1. Open the Cloudflare Dashboard.
2. Go to Workers & Pages.
3. Select the `tafeng` Worker.
4. Open Settings.
5. Add a custom domain or route under Domains & Routes.

## Two-Factor Authentication

The UI already includes a two-factor authentication switch and the login flow placeholder. In development mode, the placeholder code is:

```text
000000
```

For production, integrate a standard TOTP flow:

- Generate a TOTP secret for the administrator.
- Bind it through a QR code in an Authenticator app.
- Verify TOTP in the Worker login logic.
- Store the TOTP secret encrypted in KV or as a Worker Secret.

Related files:

- [worker/auth.ts](./worker/auth.ts)
- [src/components/SettingsPanel.tsx](./src/components/SettingsPanel.tsx)

## File Upload and Download

Upload endpoint:

```text
POST /api/files/upload
```

The Worker checks `Content-Length` and returns `413` for files larger than 10 GB. Uploaded content is written to the R2 bucket:

```text
TAFENG_FILES
```

Recommended flow after real SFTP integration:

1. Browser uploads to the Worker.
2. Worker streams the large file into a temporary R2 object.
3. Rust gateway or SSH/SFTP adapter reads from R2 and uploads to the VPS.
4. Temporary R2 objects are deleted after completion.

This avoids keeping an unstable long-running browser-to-Worker-to-VPS transfer open.

## Command History

Tafeng stores executed commands globally across all VPS connections, up to 100000 entries.

Endpoints:

```text
GET /api/command-history?limit=300&offset=0
DELETE /api/command-history
```

Storage design:

- KV stores a global index.
- Each command is stored as a separate KV entry.
- When the history exceeds 100000 entries, the oldest entries are deleted automatically.

## Multilingual UI

Currently supported:

- Chinese
- English

Frontend translations are stored in:

```text
src/lib/i18n.ts
```

To add a new language:

1. Extend the `Language` type in `shared/types.ts`.
2. Add a dictionary in `src/lib/i18n.ts`.
3. Add an option in the language selector inside `SettingsPanel`.

## Rust Gateway

`rust-gateway/` is the reserved backend skeleton for real SSH/SFTP support.

Run it with:

```bash
cd rust-gateway
cargo run
```

Default address:

```text
http://127.0.0.1:9090
```

Health check:

```bash
curl http://127.0.0.1:9090/health
```

Current gateway routes:

- `/health`
- `/ssh` WebSocket placeholder
- `/sftp/upload` upload placeholder
- `/sftp/download` download placeholder

Recommended future work:

- Integrate `russh` or a system `ssh` subprocess.
- Implement streaming SFTP upload/download.
- Add internal authentication between Worker and gateway.
- Add task status callbacks and large-file progress reporting.

## Security Checklist

Before production deployment:

- Set a strong admin password with `npx wrangler secret put ADMIN_PASSWORD`.
- Integrate real TOTP two-factor authentication.
- Do not store SSH passwords or private keys in plaintext long term.
- Add encryption for VPS credentials stored in KV.
- Restrict Worker access or add additional access control if needed.
- Periodically clear unnecessary command history.
- Add cleanup rules for temporary R2 upload objects.
- Add connection timeouts, command auditing, and robust error handling for real SSH integration.

## Common Commands

```bash
# Install dependencies
npm install

# Start frontend dev server
npm run dev

# Type check
npm run typecheck

# Build frontend
npm run build

# Run Worker locally
npm run worker:dev

# Deploy Worker
npm run worker:deploy

# Run Rust gateway
cd rust-gateway
cargo run
```

## FAQ

### 1. I cannot log in.

Make sure the production admin password is configured:

```bash
npx wrangler secret put ADMIN_PASSWORD
```

When no Secret is configured during local development, the default password is `tafeng`.

### 2. Wrangler says the KV id is invalid.

Make sure you have run:

```bash
npx wrangler kv namespace create TAFENG_KV
npx wrangler kv namespace create TAFENG_KV --preview
```

Then copy the generated `id` and `preview_id` into [wrangler.toml](./wrangler.toml).

### 3. File upload fails.

Make sure the R2 buckets exist and that `bucket_name` and `preview_bucket_name` in [wrangler.toml](./wrangler.toml) are correct.

### 4. The terminal does not connect to a real VPS yet.

This is expected for the current prototype. Real SSH/SFTP needs to be implemented in [worker/sshBridge.ts](./worker/sshBridge.ts) or [rust-gateway](./rust-gateway).

### 5. Is command history isolated by VPS?

No. The current design uses global command history. Commands from all VPS connections go into one shared list, up to 100000 entries.

## License

This project is licensed under the MIT License. You may use, modify, distribute, and use it commercially, as long as the copyright and license notices are preserved. See [LICENSE](./LICENSE).
