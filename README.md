<img width="1141" height="696" alt="image" src="https://github.com/user-attachments/assets/0fa2cfab-9920-41ab-b808-a94993416c4d" /># FileShareApp

A simple personal cloud storage web app — like Google Drive, but minimal. No email registration: just a **workspace name** and a **password**.

## Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MongoDB + Mongoose
- **Auth:** bcrypt, express-session, connect-mongo
- **Uploads:** Multer

## Requirements

- Node.js 16+
- A running MongoDB instance (local or Atlas)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   A `.env` file is already included with sane local defaults:

   ```
  PORT=3000
MONGO_URI=mongodb+srv://ullasbhgowdaullas_db_user:FileShare2026db@cluster0.oy9hfhb.mongodb.net/fileshareapp?retryWrites=true&w=majority
SESSION_SECRET=fileshareapp_super_secret_key_change_this_in_production
NODE_ENV=development
   ```

   - If you're using **MongoDB Atlas** or a remote database, replace `MONGO_URI` with your connection string.
   - If you're running MongoDB locally, make sure `mongod` is running on port `27017` (or update `MONGO_URI` to match).
   - Change `SESSION_SECRET` to a long random string before deploying anywhere public.

3. **Start the server**

   ```bash
   node server.js
   ```

   You should see:
1. Open **https://fileshareapp-production.up.railway.app** to try it live.
<<<<<<< HEAD
=======
      
>>>>>>> 0a1a981ffc5717891a886997b7c9207636acc515
## How Login Works

There's no email/signup form. On the landing page you just enter:

- **Workspace Name** (e.g. `ullas`)
- **Password** (e.g. `12345`)

- If that workspace name doesn't exist yet → it's created automatically, the password is hashed with bcrypt, and you're logged straight in.
- If the workspace already exists → your password is checked against the stored hash. Correct → dashboard. Incorrect → "Incorrect Password."

## Features

- Drag-and-drop or click-to-browse upload, multiple files at once, with a live progress bar per upload batch
- Any file type supported (images, video, PDF, ZIP, RAR, Office docs, audio, etc.)
- File cards with name, size, upload date, and Download / Preview / Copy Share Link / Delete actions
- Image, video, audio, and PDF inline preview
- Public share links (`/download/:shareId`) that work without logging in
- Search files by name
- Storage usage tracking per workspace
- Change password from Settings
- Dark mode (default) with a light mode toggle, persisted in `localStorage`
- Fully responsive layout

## Project Structure

```
FileShareApp/
├── config/          → MongoDB connection
├── controllers/      → Auth + file business logic
├── models/            → Mongoose schemas (Workspace, File)
├── middleware/    → Session-based auth guard
├── routes/            → Express route definitions
├── public/            → Static frontend (HTML/CSS/JS)
├── uploads/          → Uploaded files land here (created automatically)
├── server.js         → App entry point
└── package.json
```

## Security Notes

- Passwords are hashed with bcrypt — plaintext is never stored.
- Dashboard, file list, upload, download-by-id, and delete routes all require a valid session and are scoped to the logged-in workspace's own files.
- Only the dedicated public share routes (`/api/files/share/:shareId` and `/download/:shareId`) allow access without a session, and only for the specific file the link points to.
- Sessions are stored in MongoDB via `connect-mongo` so they survive server restarts.
