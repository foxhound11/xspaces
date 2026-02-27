# xspaces (Space2Thread)

Grab the best snippets from X (Twitter) spaces and automatically turn them into viral Twitter threads!

Space2Thread is a local, AI-powered tool that downloads Twitter Spaces audio, transcribes the conversation, identifies the most viral moments, and writes an engaging Twitter thread summarising the space.

## Features
- **Auto-Scouting:** Easily find the latest Twitter spaces from specific users.
- **Audio Download:** Locally downloads the space using `ffmpeg` and `yt-dlp`.
- **Intelligent Transcription:** Uses Google's Gemini 2.0 Flash to accurately transcribe audio.
- **Viral Segment Extraction:** Plucks out the highest-signal, most interesting 60-90 second moments from the transcript.
- **Thread Generation:** Crafts human-like, engaging Twitter threads without sounding like an AI bot.

## Prerequisites
- **Python 3.12+**
- **Node.js & npm** (for the frontend)
- [FFmpeg](https://ffmpeg.org/download.html) installed and added to your system PATH
- API Keys:
  - **Apify API Token** (for finding spaces)
  - **OpenRouter API Key** (for accessing LLMs like Gemini and Grok)

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/foxhound11/xspaces.git
   cd xspaces
   ```

2. **Backend Setup:**
   Navigate to the `backend` folder and install the required Python packages:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
   Create a `.env` file in the `backend` directory and add your keys:
   ```env
   OPENROUTER_API_KEY=your_key_here
   APIFY_API_TOKEN=your_token_here
   ```

3. **Frontend Setup:**
   Navigate to the `frontend` folder and install dependencies:
   ```bash
   cd frontend
   npm install
   ```

## Running the App

The easiest way to run the application on Windows is to double-click the `start_app.bat` file in the root directory.

This script will automatically:
1. Start the Python FastAPI backend.
2. Start the Vite React frontend.
3. Open the app in your default web browser (`http://localhost:5173`).

## Usage
1. Open the UI and click the ghost icon to automatically find the latest space from a target user, or paste an X Space URL directly.
2. Click **Process Space**.
3. Watch the terminal as the backend downloads the audio, transcribes it, extracts viral segments, and writes your thread!
4. Review the generated thread on the right panel.

## Architecture
- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Python + FastAPI + Uvicorn
- **AI/LLM:** OpenRouter (Gemini 2.0 Flash by default)
