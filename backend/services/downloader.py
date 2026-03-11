import os
import glob
from pathlib import Path
import yt_dlp
import json
import queue
import threading
import re

DOWNLOAD_DIR = "downloads"

# Get the project root directory (parent of backend)
PROJECT_ROOT = Path(__file__).parent.parent.parent.resolve()

# FFmpeg binary location
FFMPEG_DIR = PROJECT_ROOT / "ffmpeg" / "ffmpeg-8.0.1-essentials_build" / "bin"

# Ensure download directory exists
if not os.path.exists(DOWNLOAD_DIR):
    os.makedirs(DOWNLOAD_DIR)

# Path to cookies file for YouTube authentication
COOKIES_FILE = PROJECT_ROOT / "cookies.txt"

def _get_cookie_opts() -> dict:
    """Returns yt-dlp cookie options if cookies.txt exists."""
    if COOKIES_FILE.exists():
        return {'cookiefile': str(COOKIES_FILE)}
    return {}

def download_space_generator(url: str):
    """
    Downloads a Twitter Space as MP3 using yt-dlp API.
    Yields progress information as JSON strings ending with newline.
    """
    output_template = os.path.join(DOWNLOAD_DIR, "%(title)s.%(ext)s")
    q = queue.Queue()
    
    def progress_hook(d):
        if d['status'] == 'downloading':
            percent = 0.0
            if d.get('total_bytes') or d.get('total_bytes_estimate'):
                total = d.get('total_bytes') or d.get('total_bytes_estimate', 0)
                downloaded = d.get('downloaded_bytes', 0)
                percent = (downloaded / total) * 100 if total > 0 else 0
            elif d.get('total_frags'):
                total = d.get('total_frags', 0)
                downloaded = d.get('frag_index', 0)
                percent = (downloaded / total) * 100 if total > 0 else 0
            else:
                percent_str = d.get('_percent_str', '0.0%')
                if isinstance(percent_str, str):
                    percent_str = re.sub(r'\x1b\[[0-9;]*m', '', percent_str).replace('%', '').strip()
                    try:
                        percent = float(percent_str)
                    except ValueError:
                        pass
                
            q.put({
                "status": "downloading",
                "progress": round(percent, 2),
                "speed": re.sub(r'\x1b\[[0-9;]*m', '', d.get('_speed_str', 'N/A')).strip() if isinstance(d.get('_speed_str'), str) else 'N/A',
                "eta": d.get('_eta_str', 'N/A')
            })
        elif d['status'] == 'finished':
            q.put({
                "status": "processing",
                "progress": 100,
                "message": "Converting audio to MP3..."
            })

    def run_download():
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': output_template,
            'ffmpeg_location': str(FFMPEG_DIR),
            'concurrent_fragment_downloads': 10,
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
            'progress_hooks': [progress_hook],
            'quiet': True,
            'no_warnings': True,
        }
        
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                # First check if the file already exists by predicting the filename
                info_dict_meta = ydl.extract_info(url, download=False)
                filename_predicted = ydl.prepare_filename(info_dict_meta)
                base_predicted, _ = os.path.splitext(filename_predicted)
                predicted_mp3_path = base_predicted + ".mp3"
                
                if os.path.exists(predicted_mp3_path):
                    q.put({
                        "status": "completed",
                        "filename": os.path.basename(predicted_mp3_path),
                        "filepath": predicted_mp3_path,
                        "cached": True
                    })
                    return
                
                # If it doesn't exist, proceed with the actual download
                info_dict = ydl.extract_info(url, download=True)
                
                final_path = ""
                if 'requested_downloads' in info_dict:
                    final_path = info_dict['requested_downloads'][0]['filepath']
                else:
                    filename = ydl.prepare_filename(info_dict)
                    base, _ = os.path.splitext(filename)
                    final_path = base + ".mp3"
                    
                q.put({
                    "status": "completed",
                    "filename": os.path.basename(final_path),
                    "filepath": final_path,
                    "cached": False
                })
        except Exception as e:
            q.put({
                "status": "error",
                "message": str(e)
            })



    thread = threading.Thread(target=run_download)
    thread.start()

    while True:
        try:
            msg = q.get(timeout=1.0)
            yield json.dumps(msg) + "\n"
            if msg["status"] in ["completed", "error"]:
                break
        except queue.Empty:
            if not thread.is_alive():
                break

def download_space(url: str) -> str:
    """
    Synchronous download function used by other endpoints that don't need streaming.
    Returns the absolute path to the downloaded MP3.
    """
    output_template = os.path.join(DOWNLOAD_DIR, "%(title)s.%(ext)s")
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': output_template,
        'ffmpeg_location': str(FFMPEG_DIR),
        'concurrent_fragment_downloads': 10,
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'quiet': True,
        'no_warnings': True,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        # Check cache first
        info_dict_meta = ydl.extract_info(url, download=False)
        filename_predicted = ydl.prepare_filename(info_dict_meta)
        base_predicted, _ = os.path.splitext(filename_predicted)
        predicted_mp3_path = os.path.abspath(base_predicted + ".mp3")
        
        if os.path.exists(predicted_mp3_path):
            print(f"[Cache Hit] Re-using existing download: {predicted_mp3_path}")
            return predicted_mp3_path
            
        # If not cached, download it
        info_dict = ydl.extract_info(url, download=True)
        if 'requested_downloads' in info_dict:
            return os.path.abspath(info_dict['requested_downloads'][0]['filepath'])
        else:
            filename = ydl.prepare_filename(info_dict)
            base, _ = os.path.splitext(filename)
            return os.path.abspath(base + ".mp3")


# ─────────────────────────────────────────────
# YouTube / Video Download Functions
# ─────────────────────────────────────────────

VIDEOS_DIR = "downloads/videos"
if not os.path.exists(VIDEOS_DIR):
    os.makedirs(VIDEOS_DIR)


def get_video_formats(url: str) -> list:
    """
    Extracts available video formats/qualities for a given URL.
    Returns a list of dicts with height, format_note, filesize_approx, ext.
    """
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'skip_download': True,
        **_get_cookie_opts(),
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False, process=False)
        # If process=False didn't give us formats, try again with processing
        if not info.get('formats'):
            info = ydl.extract_info(url, download=False)

    formats = info.get('formats', [])
    seen_heights = set()
    quality_list = []

    for f in formats:
        height = f.get('height')
        vcodec = f.get('vcodec', 'none')
        if not height or vcodec == 'none':
            continue
        if height in seen_heights:
            continue
        seen_heights.add(height)
        quality_list.append({
            'height': height,
            'label': f'{height}p',
        })

    # Sort descending by height (best first)
    quality_list.sort(key=lambda x: x['height'], reverse=True)

    return {
        "title": info.get('title', 'Unknown'),
        "thumbnail": info.get('thumbnail', ''),
        "duration": info.get('duration', 0),
        "qualities": quality_list,
    }


def download_video_generator(url: str, quality: str = "1080"):
    """
    Downloads a video as MP4 using yt-dlp API with quality selection.
    Yields progress information as JSON strings ending with newline.
    """
    output_template = os.path.join(VIDEOS_DIR, "%(title)s.%(ext)s")
    q = queue.Queue()

    height = quality.replace('p', '')

    def progress_hook(d):
        if d['status'] == 'downloading':
            percent = 0.0
            if d.get('total_bytes') or d.get('total_bytes_estimate'):
                total = d.get('total_bytes') or d.get('total_bytes_estimate', 0)
                downloaded = d.get('downloaded_bytes', 0)
                percent = (downloaded / total) * 100 if total > 0 else 0
            elif d.get('total_frags'):
                total = d.get('total_frags', 0)
                downloaded = d.get('frag_index', 0)
                percent = (downloaded / total) * 100 if total > 0 else 0
            else:
                percent_str = d.get('_percent_str', '0.0%')
                if isinstance(percent_str, str):
                    percent_str = re.sub(r'\x1b\[[0-9;]*m', '', percent_str).replace('%', '').strip()
                    try:
                        percent = float(percent_str)
                    except ValueError:
                        pass

            q.put({
                "status": "downloading",
                "progress": round(percent, 2),
                "speed": re.sub(r'\x1b\[[0-9;]*m', '', d.get('_speed_str', 'N/A')).strip() if isinstance(d.get('_speed_str'), str) else 'N/A',
                "eta": d.get('_eta_str', 'N/A')
            })
        elif d['status'] == 'finished':
            q.put({
                "status": "processing",
                "progress": 100,
                "message": "Merging video and audio..."
            })

    def run_download():
        format_str = f'bestvideo[height<={height}]+bestaudio/best[height<={height}]/bestvideo+bestaudio/best'
        ydl_opts = {
            'format': format_str,
            'merge_output_format': 'mp4',
            'outtmpl': output_template,
            'ffmpeg_location': str(FFMPEG_DIR),
            'concurrent_fragment_downloads': 10,
            'progress_hooks': [progress_hook],
            'quiet': True,
            'no_warnings': True,
            **_get_cookie_opts(),
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                # Check cache first
                info_dict_meta = ydl.extract_info(url, download=False)
                filename_predicted = ydl.prepare_filename(info_dict_meta)
                base_predicted, _ = os.path.splitext(filename_predicted)
                predicted_mp4_path = base_predicted + ".mp4"

                if os.path.exists(predicted_mp4_path):
                    q.put({
                        "status": "completed",
                        "filename": os.path.basename(predicted_mp4_path),
                        "filepath": predicted_mp4_path,
                        "cached": True
                    })
                    return

                # Download
                info_dict = ydl.extract_info(url, download=True)

                final_path = ""
                if 'requested_downloads' in info_dict:
                    final_path = info_dict['requested_downloads'][0]['filepath']
                else:
                    filename = ydl.prepare_filename(info_dict)
                    base, _ = os.path.splitext(filename)
                    final_path = base + ".mp4"

                q.put({
                    "status": "completed",
                    "filename": os.path.basename(final_path),
                    "filepath": final_path,
                    "cached": False
                })
        except Exception as e:
            q.put({
                "status": "error",
                "message": str(e)
            })

    thread = threading.Thread(target=run_download)
    thread.start()

    while True:
        try:
            msg = q.get(timeout=1.0)
            yield json.dumps(msg) + "\n"
            if msg["status"] in ["completed", "error"]:
                break
        except queue.Empty:
            if not thread.is_alive():
                break
