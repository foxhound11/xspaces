import os
import subprocess
import json
import uuid
import shutil
import base64
import requests
import concurrent.futures
from pathlib import Path

# Project root (parent of backend)
PROJECT_ROOT = Path(__file__).parent.parent.parent.resolve()
REMOTION_DIR = PROJECT_ROOT / "remotion"
REMOTION_PUBLIC = REMOTION_DIR / "public"
CLIPS_DIR = PROJECT_ROOT / "downloads" / "clips"
LOGOS_DIR = PROJECT_ROOT / "downloads" / "logos"
FFMPEG_DIR = PROJECT_ROOT / "ffmpeg" / "ffmpeg-8.0.1-essentials_build" / "bin"

REMOTION_PUBLIC.mkdir(parents=True, exist_ok=True)
CLIPS_DIR.mkdir(parents=True, exist_ok=True)
LOGOS_DIR.mkdir(parents=True, exist_ok=True)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


from ..utils import get_env_var


def get_word_timestamps(audio_path: str, duration_seconds: float) -> list:
    """
    Transcribes audio using Deepgram Nova-3 for mathematically perfect
    word-level timestamps with zero drift.
    Returns list of {text, start, end} per individual word.
    """
    api_key = get_env_var("DEEPGRAM_API_KEY")
    if not api_key:
        print("Missing DEEPGRAM_API_KEY in .env")
        return []

    print("Transcribing audio clip with Deepgram Nova-3 for perfect sync...")
    
    url = "https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true&punctuate=true"
    headers = {
        "Authorization": f"Token {api_key}",
    }
    
    try:
        with open(audio_path, "rb") as f:
            resp = requests.post(url, headers=headers, data=f)
            
        if resp.status_code != 200:
            print(f"Deepgram API error ({resp.status_code}): {resp.text}")
            return []
            
        data = resp.json()
        raw_words = data["results"]["channels"][0]["alternatives"][0]["words"]
        
        words = []
        for w in raw_words:
            words.append({
                "text": w.get("punctuated_word", w.get("word", "")),
                "start": w["start"],
                "end": w["end"]
            })
            
        print(f"Got {len(words)} highly accurate word-level timestamps from Deepgram")
        return words
    except Exception as e:
        print(f"Deepgram transcription failed: {e}")
        return []


def slice_audio(input_path: str, start_time: float, end_time: float) -> str:
    """
    Slices audio into remotion/public/ for static file serving.
    Returns filename (not full path).
    """
    filename = f"slice_{uuid.uuid4().hex[:8]}.mp3"
    output_path = str(REMOTION_PUBLIC / filename)

    ffmpeg_bin = str(FFMPEG_DIR / "ffmpeg.exe")
    duration = end_time - start_time

    cmd = [
        ffmpeg_bin, "-y",
        "-i", input_path,
        "-ss", str(start_time),
        "-t", str(duration),
        "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",  # normalize to -16 LUFS
        "-acodec", "libmp3lame",
        "-q:a", "2",
        output_path,
    ]

    print(f"Slicing audio: {start_time}s - {end_time}s ({duration:.0f}s)")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise Exception(f"FFmpeg slice failed: {result.stderr}")

    return filename


def render_clip(
    audio_path: str,
    start_time: float,
    end_time: float,
    layout: str,
    title: str,
    caption_text: str = "",
    logo_path: str = None,
    logo_position: str = "top-right",
    colors: dict = None,
) -> str:
    """
    Renders a video clip using Remotion.

    Steps:
    1. Slice audio into remotion/public/
    2. Transcribe the slice (if caption_text not provided)
    3. Copy logo to remotion/public/ if provided
    4. Render with Remotion CLI
    5. Return path to output MP4
    """
    if colors is None:
        colors = {
            "background": "#0a0a0a",
            "waveform": "#a855f7",
            "text": "#ffffff",
            "accent": "#3b82f6",
        }

    layout_map = {
        "centered_waveform": "CenteredWaveform",
        "split_screen": "SplitScreen",
        "podcast_card": "PodcastCard",
    }
    composition_id = layout_map.get(layout, "CenteredWaveform")

    # 1. Slice audio
    audio_filename = slice_audio(audio_path, start_time, end_time)
    duration_seconds = end_time - start_time
    sliced_audio_path = str(REMOTION_PUBLIC / audio_filename)

    # 2. Get word-level timestamps for karaoke captions
    words = get_word_timestamps(sliced_audio_path, duration_seconds)

    # Build plain text fallback from words
    plain_text = " ".join(w.get("text", "") for w in words) if words else (caption_text or "")

    # 3. Copy logo
    logo_filename = None
    if logo_path and os.path.exists(logo_path):
        ext = Path(logo_path).suffix
        logo_filename = f"logo_{uuid.uuid4().hex[:8]}{ext}"
        shutil.copy2(logo_path, str(REMOTION_PUBLIC / logo_filename))

    # 4. Build props
    input_props = {
        "audioFile": audio_filename,
        "title": title,
        "words": words if words else None,     # word-level timestamps → KaraokeCaptions
        "captionText": plain_text,              # fallback for SimpleEvenCaptions
        "captions": None,
        "logoFile": logo_filename,
        "logoPosition": logo_position,
        "colors": colors,
        "durationInSeconds": duration_seconds,
    }

    output_filename = f"clip_{uuid.uuid4().hex[:8]}.mp4"
    output_path = str(CLIPS_DIR / output_filename)

    props_file = str(CLIPS_DIR / f"props_{uuid.uuid4().hex[:8]}.json")
    with open(props_file, "w") as f:
        json.dump(input_props, f)

    # 5. Render
    command = [
        "npx", "remotion", "render",
        "src/index.ts", composition_id, output_path,
        "--props", props_file,
    ]

    print(f"Rendering: {composition_id} ({duration_seconds:.0f}s)")
    result = subprocess.run(
        command,
        cwd=str(REMOTION_DIR),
        capture_output=True,
        text=True,
        shell=True,
    )

    # Cleanup temps
    for f in [props_file, sliced_audio_path]:
        try: os.remove(f)
        except: pass
    if logo_filename:
        try: os.remove(str(REMOTION_PUBLIC / logo_filename))
        except: pass

    if result.returncode != 0:
        print(f"Remotion stderr:\n{result.stderr[-1000:]}")
        raise Exception(f"Remotion render failed: {result.stderr[-500:]}")

    print(f"Clip ready: {output_path}")
    return output_path
