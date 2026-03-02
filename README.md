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

## 🧠 Why I Built This & What I Learned

At first glance, this might look like a simple audio scraper, but the real focus of this project was tackling three complex engineering problems: **programmatic video rendering**, **perfect audio-text synchronization**, and **autonomous AI evaluation loops**.

Here are the core technical challenges this project solves:

### 1. Programmatic Video Generation (Remotion)
Building TikTok/Reels-style clips manually takes hours. I wanted to build an engine that generates them entirely in code. By integrating **Remotion**, the app takes an audio file, a transcript, and a brand configuration, and programmatically renders a React component tree directly into an MP4 file. It handles dynamic waveform visualization and layout structures (like Split Screen or Podcast Card) purely through mathematics and React state, completely removing the need for traditional video editing software.

### 2. The Karaoke Caption Synchronization Problem (Deepgram)
Getting TikTok-style "karaoke" captions (where the exact word lights up as it's spoken) is notoriously difficult. Standard transcription models (like Whisper or default Gemini) drift out of sync over time or chunk timestamps too broadly (e.g., giving a timestamp for a whole 5-second sentence). 

To solve this, I implemented the **Deepgram Nova-3 API**. Its architecture is specifically optimized for hyper-accurate, **word-level timestamps**. The backend parses Deepgram's precise JSON timing data and maps it to the Remotion video timeline, guaranteeing that the heavy, stylized captions strike on the exact millisecond the word is spoken without drifting.

### 3. Multi-Agent LLM Architecture (Writer/Judge Loop)
Most "AI Summarizers" just dump a transcript into an LLM with a "summarize this" prompt, resulting in generic, boring text that misses the nuance of the conversation. 

Instead, I built an asynchronous **Writer/Judge evaluation loop**:
1. **The Extractor:** First, an LLM analyzes the transcript specifically looking for high-signal, high-retention "viral hooks" and extracts only those segments.
2. **The Writer:** A separate prompt takes those segments and drafts a human-like Twitter thread.
3. **The Judge:** A critique model evaluates the drafted thread against strict virality and formatting rules. If the thread fails the check, the Judge feeds specific critique back to the Writer for a rewrite.

This multi-agent iteration ensures the final output actually sounds like a native platform user, not a robotic script, and guarantees the highest quality highlights are extracted without hallucinating or losing context.
