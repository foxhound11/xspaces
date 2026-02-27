import os
import base64
import requests
import json
from dotenv import load_dotenv

# Load .env from backend directory explicitly
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(env_path)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
# Using Google Gemini 2.0 Flash via OpenRouter (Gemini 1.5 is deprecated)
MODEL = "google/gemini-2.0-flash-001"


from ..config import ConfigManager

def _send_to_openrouter(messages, model):
    """Helper to send requests to OpenRouter"""
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://space2thread.app",
        "X-Title": "Space2Thread"
    }
    payload = {
        "model": model,
        "messages": messages
    }
    
    print(f"Sending request to OpenRouter ({model})...")
    response = requests.post(OPENROUTER_URL, headers=headers, data=json.dumps(payload))
    
    if response.status_code != 200:
        raise Exception(f"OpenRouter API Error ({response.status_code}): {response.text}")

    result = response.json()
    try:
        return result["choices"][0]["message"]["content"]
    except (KeyError, IndexError):
        raise Exception(f"Unexpected response format: {result}")

def analyze_audio(file_path: str) -> str:
    """
    Orchestrates the 3-step analysis pipeline using dynamic config.
    """
    if not OPENROUTER_API_KEY:
        raise Exception("OPENROUTER_API_KEY not found in .env")

    # Load latest config
    config = ConfigManager.get_config()
    models = config.get("models", {})
    prompts = config.get("prompts", {})

    model_transcript = models.get("transcript", "google/gemini-2.0-flash-001")
    model_extract = models.get("extract", "google/gemini-2.0-flash-001")
    model_verify = models.get("verify", "google/gemini-2.0-flash-001")

    prompt_transcript = prompts.get("transcript", "")
    prompt_extract = prompts.get("extract", "")
    prompt_verify = prompts.get("verify", "")

    # 1. Encode Audio
    print("Encoding audio...")
    with open(file_path, "rb") as audio_file:
        encoded_string = base64.b64encode(audio_file.read()).decode("utf-8")

    # ---------------------------------------------------------
    # STEP 1: GENERATE TRANSCRIPT
    # ---------------------------------------------------------
    print(f"--- Step 1: Generating Transcript ({model_transcript}) ---")
    messages_step1 = [
        {"role": "system", "content": prompt_transcript},
        {"role": "user", "content": [
            {"type": "text", "text": "Here is the audio file. Please transcribe it."},
            {"type": "input_audio", "input_audio": {"data": encoded_string, "format": "mp3"}}
        ]}
    ]
    transcript_text = _send_to_openrouter(messages_step1, model=model_transcript)
    print("Transcript generated successfully.")

    # ---------------------------------------------------------
    # STEP 2: EXTRACT SEGMENTS
    # ---------------------------------------------------------
    print(f"--- Step 2: Extracting Viral Segments ({model_extract}) ---")
    messages_step2 = [
        {"role": "system", "content": prompt_extract},
        {"role": "user", "content": f"Here is the transcript:\n\n{transcript_text}"}
    ]
    initial_segments = _send_to_openrouter(messages_step2, model=model_extract)
    print("Initial segments extracted.")

    # ---------------------------------------------------------
    # STEP 3: VERIFY & REFINE
    # ---------------------------------------------------------
    print(f"--- Step 3: Verifying and Refining ({model_verify}) ---")
    messages_step3 = [
        {"role": "system", "content": prompt_verify},
        {"role": "user", "content": f"ORIGINAL TRANSCRIPT:\n{transcript_text}\n\nDRAFT SEGMENTS:\n{initial_segments}"}
    ]
    final_segments = _send_to_openrouter(messages_step3, model=model_verify)
    print("Final verification complete.")

    # Combine for final report
    final_report = f"""
{final_segments}

---

# Full Transcript
{transcript_text}
"""
    return final_report

