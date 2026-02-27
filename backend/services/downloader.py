import os
import glob
import subprocess
from datetime import datetime
import sys
from pathlib import Path

DOWNLOAD_DIR = "downloads"

# Get the project root directory (parent of backend)
PROJECT_ROOT = Path(__file__).parent.parent.parent.resolve()

# FFmpeg binary location
FFMPEG_DIR = PROJECT_ROOT / "ffmpeg" / "ffmpeg-8.0.1-essentials_build" / "bin"

# Ensure download directory exists
if not os.path.exists(DOWNLOAD_DIR):
    os.makedirs(DOWNLOAD_DIR)

def download_space(url: str) -> str:
    """
    Downloads a Twitter Space as MP3 using yt-dlp.
    Returns the absolute path to the downloaded file.
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    # Template: downloads/space_20231027_103000.mp3
    output_template = os.path.join(DOWNLOAD_DIR, f"space_{timestamp}.%(ext)s")
    
    # Command to download audio-only, convert to mp3
    # -x: Extract audio
    # --audio-format mp3: Convert to mp3
    # -o: Output template
    # --ffmpeg-location: Path to local FFmpeg binaries
    command = [
        sys.executable, "-m", "yt_dlp",
        "-x",
        "--audio-format", "mp3",
        "--ffmpeg-location", str(FFMPEG_DIR),
        "-o", output_template,
        url
    ]
    
    print(f"Starting download for: {url}")
    try:
        subprocess.run(command, check=True)
    except subprocess.CalledProcessError as e:
        raise Exception(f"Download failed: {str(e)}")
    
    # Find the file we just downloaded (yt-dlp might append logic to filenames)
    # We look for files starting with space_{timestamp} in the dir
    search_pattern = os.path.join(DOWNLOAD_DIR, f"space_{timestamp}*.mp3")
    files = glob.glob(search_pattern)
    
    if not files:
        raise Exception("Download completed but file not found.")
        
    return os.path.abspath(files[0])
