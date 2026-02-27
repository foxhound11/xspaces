from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List
import requests
import os
import uuid
from pathlib import Path
from .services.downloader import download_space
from .services.processor import analyze_audio, OPENROUTER_API_KEY
from .services.thread_generator import generate_thread
from .services.scout import ScoutService
from .services.clip_renderer import render_clip, CLIPS_DIR, LOGOS_DIR
from .config import ConfigManager

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    url: str

class ThreadResult(BaseModel):
    thread: str
    iterations: int
    approved: bool
    feedback_history: List[dict]

class AnalyzeResponse(BaseModel):
    markdown_report: str
    audio_path: str
    thread_result: Optional[ThreadResult] = None

class ConfigRequest(BaseModel):
    models: dict
    prompts: dict

class ScoutRequest(BaseModel):
    username: str = ""

class ThreadRequest(BaseModel):
    transcript: str
    segments: str

class RenderClipRequest(BaseModel):
    audio_path: str
    start_time: float
    end_time: float
    layout: str = "centered_waveform"
    title: str = "Space2Thread"
    caption_text: str = ""
    logo_path: Optional[str] = None
    logo_position: str = "top-right"
    colors: Optional[dict] = None

@app.get("/api/models")
async def get_models():
    """Fetches available models from OpenRouter."""
    try:
        response = requests.get("https://openrouter.ai/api/v1/models")
        if response.status_code == 200:
            data = response.json()
            # Sort by ID for easier finding
            models = sorted(data["data"], key=lambda x: x["id"])
            return {"models": models}
        return {"models": []}
    except Exception as e:
        print(f"Error fetching models: {e}")
        return {"models": []}

@app.get("/api/config")
async def get_config():
    """Returns current configuration."""
    return ConfigManager.get_config()

@app.post("/api/config")
async def update_config(request: ConfigRequest):
    """Updates configuration."""
    return ConfigManager.update_config(request.dict())

@app.post("/api/scout")
async def scout_space(request: ScoutRequest):
    """Finds the latest space for a user."""
    try:
        url = ScoutService.find_latest_space(request.username)
        if not url:
             raise HTTPException(status_code=404, detail="No recent spaces found for this user.")
        return {"url": url}
    except Exception as e:
        print(f"Scout Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-thread")
async def api_generate_thread(request: ThreadRequest):
    """Standalone endpoint to generate thread from transcript + segments."""
    try:
        result = generate_thread(request.transcript, request.segments)
        return result
    except Exception as e:
        print(f"Thread Generation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/process", response_model=AnalyzeResponse)
async def process_space(request: AnalyzeRequest):
    try:
        # 1. Download
        print(f"Received request for URL: {request.url}")
        audio_path = download_space(request.url)
        print(f"Downloaded to: {audio_path}")
        
        # 2. Analyze (extract viral segments)
        print("Starting analysis...")
        report = analyze_audio(audio_path)
        print("Analysis complete.")
        
        # 3. Generate tweet thread automatically
        print("Generating tweet thread...")
        thread_result = None
        try:
            # Split report to get transcript and segments
            # Report format: segments + "---\n\n# Full Transcript\n" + transcript
            if "# Full Transcript" in report:
                parts = report.split("# Full Transcript")
                segments = parts[0].strip()
                transcript = parts[1].strip() if len(parts) > 1 else ""
            else:
                segments = report
                transcript = ""
            
            if transcript:
                result = generate_thread(transcript, segments)
                thread_result = ThreadResult(
                    thread=result["thread"],
                    iterations=result["iterations"],
                    approved=result["approved"],
                    feedback_history=result["feedback_history"]
                )
                print(f"Thread generated: approved={result['approved']}, iterations={result['iterations']}")
            else:
                print("Warning: Could not extract transcript for thread generation")
        except Exception as thread_error:
            print(f"Thread generation failed (non-fatal): {thread_error}")
            # Continue without thread - don't fail the whole request
        
        return AnalyzeResponse(
            markdown_report=report,
            audio_path=audio_path,
            thread_result=thread_result
        )
        
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/render-clip")
async def api_render_clip(request: RenderClipRequest):
    """Renders a video clip from a segment."""
    try:
        output_path = render_clip(
            audio_path=request.audio_path,
            start_time=request.start_time,
            end_time=request.end_time,
            layout=request.layout,
            title=request.title,
            caption_text=request.caption_text,
            logo_path=request.logo_path,
            logo_position=request.logo_position,
            colors=request.colors,
        )
        filename = os.path.basename(output_path)
        return {"clip_url": f"/api/clips/{filename}", "filename": filename}
    except Exception as e:
        print(f"Clip Render Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload-logo")
async def upload_logo(file: UploadFile = File(...)):
    """Upload a logo/profile image for use in clips."""
    try:
        ext = Path(file.filename).suffix or ".png"
        filename = f"logo_{uuid.uuid4().hex[:8]}{ext}"
        filepath = str(LOGOS_DIR / filename)
        
        with open(filepath, "wb") as f:
            content = await file.read()
            f.write(content)
        
        return {"logo_path": filepath, "filename": filename}
    except Exception as e:
        print(f"Logo Upload Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/clips/{filename}")
async def serve_clip(filename: str):
    """Serve a rendered clip for download."""
    filepath = str(CLIPS_DIR / filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Clip not found")
    return FileResponse(filepath, media_type="video/mp4", filename=filename)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
