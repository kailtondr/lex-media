# LexMedia

**LexMedia** is a multimedia "Second Brain" designed for researchers, centralizing YouTube, Google Drive, and Nextcloud video sources into a single interface with research capabilities.

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- Firebase Account (for Auth & Firestore)

### 2. Installation

```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory and add your Firebase configuration keys:

```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Running Locally

```bash
npm run dev
```

## 🏗️ Architecture

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Firebase (Auth + Firestore)
- **State Management**: React Context (`AuthContext`)
- **Routing**: `react-router-dom`
- **Media Player**: `react-player` (Handles YouTube, File Paths, etc.)

## 📅 Roadmap Status

- [x] **Step 1: Universal Media Hub** (Parser, List, Player)
- [ ] **Step 2: Playback Continuity** (Sync progress across devices)
- [ ] **Step 3: Knowledge Graph** (Markdown notes + Obsidian-like graph)
- [ ] **Step 4: AI Transcription** (Whisper integration)

## 🛠️ Key Features

- **Link Parser**: Automatically detects YouTube, Drive, or Nextcloud links and formats them for playback.
- **Resource Management**: Add, view, and filter resources by status (`New`, `In Progress`, `Watched`).
- **Premium UI**: Glassmorphism design with a focus on aesthetics.
