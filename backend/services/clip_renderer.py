import os
import subprocess
import json
import uuid
from pathlib import Path

# Project root (parent of backend)
PROJECT_ROOT = Path(__file__).parent.parent.parent.resolve()
REMOTION_DIR = PROJECT_ROOT / "remotion"
CLIPS_DIR = PROJECT_ROOT / "downloads" / "clips"
LOGOS_DIR = PROJECT_ROOT / "downloads" / "logos"
FFMPEG_DIR = PROJECT_ROOT / "ffmpeg" / "ffmpeg-8.0.1-essentials_build" / "bin"

# Ensure directories exist
CLIPS_DIR.mkdir(parents=True, exist_ok=True)
LOGOS_DIR.mkdir(parents=True, exist_ok=True)


def slice_audio(input_path: str, start_time: float, end_time: float) -> str:
    """
    Slices an audio file to a specific time range using ffmpeg.
    Returns the path to the sliced audio file.
    """
    output_filename = f"slice_{uuid.uuid4().hex[:8]}.mp3"
    output_path = str(CLIPS_DIR / output_filename)
    
    ffmpeg_bin = str(FFMPEG_DIR / "ffmpeg.exe")
    
    duration = end_time - start_time
    
    command = [
        ffmpeg_bin,
        "-y",                          # overwrite without asking
        "-i", input_path,              # input file
        "-ss", str(start_time),        # start time
        "-t", str(duration),           # duration
        "-acodec", "libmp3lame",       # encode as mp3
        "-q:a", "2",                   # quality
        output_path
    ]
    
    print(f"Slicing audio: {start_time}s - {end_time}s")
    result = subprocess.run(command, capture_output=True, text=True)
    
    if result.returncode != 0:
        raise Exception(f"FFmpeg slice failed: {result.stderr}")
    
    return output_path


def render_clip(
    audio_path: str,
    start_time: float,
    end_time: float,
    layout: str,
    title: str,
    caption_text: str,
    logo_path: str = None,
    logo_position: str = "top-right",
    colors: dict = None,
) -> str:
    """
    Renders a video clip using Remotion.
    
    1. Slices the audio to the segment range
    2. Calls npx remotion render with the chosen composition and input props
    3. Returns the path to the rendered MP4
    """
    if colors is None:
        colors = {
            "background": "#0a0a0a",
            "waveform": "#a855f7",
            "text": "#ffffff",
            "accent": "#3b82f6",
        }
    
    # Map layout names to composition IDs
    layout_map = {
        "centered_waveform": "CenteredWaveform",
        "split_screen": "SplitScreen",
        "podcast_card": "PodcastCard",
    }
    
    composition_id = layout_map.get(layout, "CenteredWaveform")
    
    # 1. Slice audio
    sliced_audio = slice_audio(audio_path, start_time, end_time)
    duration_seconds = end_time - start_time
    
    # Convert the sliced audio path to an absolute file:// URL for Remotion
    audio_url = Path(sliced_audio).resolve().as_uri()
    
    # Convert logo path to file URL if provided
    logo_url = None
    if logo_path and os.path.exists(logo_path):
        logo_url = Path(logo_path).resolve().as_uri()
    
    # 2. Build input props
    input_props = {
        "audioSrc": audio_url,
        "title": title,
        "captionText": caption_text,
        "logoSrc": logo_url,
        "logoPosition": logo_position,
        "colors": colors,
        "durationInSeconds": duration_seconds,
    }
    
    # 3. Render with Remotion CLI
    output_filename = f"clip_{uuid.uuid4().hex[:8]}.mp4"
    output_path = str(CLIPS_DIR / output_filename)
    
    # Write props to a temp file to avoid command line escaping issues
    props_file = str(CLIPS_DIR / f"props_{uuid.uuid4().hex[:8]}.json")
    with open(props_file, "w") as f:
        json.dump(input_props, f)
    
    command = [
        "npx",
        "remotion",
        "render",
        "src/index.ts",
        composition_id,
        output_path,
        "--props", props_file,
    ]
    
    print(f"Rendering clip: {composition_id} ({duration_seconds:.1f}s)")
    print(f"Output: {output_path}")
    
    result = subprocess.run(
        command,
        cwd=str(REMOTION_DIR),
        capture_output=True,
        text=True,
        shell=True,
    )
    
    # Clean up props file
    try:
        os.remove(props_file)
    except:
        pass
    
    # Clean up sliced audio
    try:
        os.remove(sliced_audio)
    except:
        pass
    
    if result.returncode != 0:
        print(f"Remotion stderr: {result.stderr}")
        print(f"Remotion stdout: {result.stdout}")
        raise Exception(f"Remotion render failed: {result.stderr}")
    
    print(f"Clip rendered successfully: {output_path}")
    return output_path
