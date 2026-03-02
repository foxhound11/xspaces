import base64
from ..config import ConfigManager
from ..utils import send_to_openrouter, get_env_var

def transcribe_full_space(file_path: str) -> str:
    """
    Transcribes an audio file using the configured LLM.
    Returns the transcript text.
    """
    if not get_env_var("OPENROUTER_API_KEY"):
        raise Exception("OPENROUTER_API_KEY not found in .env")

    config = ConfigManager.get_config()
    models = config.get("models", {})
    prompts = config.get("prompts", {})

    model_transcript = models.get("transcript", "google/gemini-2.0-flash-001")
    prompt_transcript = prompts.get("transcript", "")

    # Encode Audio
    print("Encoding audio...")
    with open(file_path, "rb") as audio_file:
        encoded_string = base64.b64encode(audio_file.read()).decode("utf-8")

    print(f"--- Generating Transcript ({model_transcript}) ---")
    messages = [
        {"role": "system", "content": prompt_transcript},
        {"role": "user", "content": [
            {"type": "text", "text": "Here is the audio file. Please transcribe it."},
            {"type": "input_audio", "input_audio": {"data": encoded_string, "format": "mp3"}}
        ]}
    ]
    transcript_text = send_to_openrouter(messages, model=model_transcript)
    print("Transcript generated successfully.")
    return transcript_text


def analyze_audio(file_path: str) -> dict:
    """
    Orchestrates the analysis pipeline using dynamic config.
    Returns a structured dictionary with transcript and segments.
    """
    if not get_env_var("OPENROUTER_API_KEY"):
        raise Exception("OPENROUTER_API_KEY not found in .env")

    # Load latest config
    config = ConfigManager.get_config()
    models = config.get("models", {})
    prompts = config.get("prompts", {})

    model_extract = models.get("extract", "google/gemini-2.0-flash-001")
    model_verify = models.get("verify", "google/gemini-2.0-flash-001")

    prompt_extract = prompts.get("extract", "")
    prompt_verify = prompts.get("verify", "")

    # Step 1: Transcribe
    transcript_text = transcribe_full_space(file_path)

    # ---------------------------------------------------------
    # STEP 2: EXTRACT SEGMENTS
    # ---------------------------------------------------------
    print(f"--- Step 2: Extracting Viral Segments ({model_extract}) ---")
    messages_step2 = [
        {"role": "system", "content": prompt_extract},
        {"role": "user", "content": f"Here is the transcript:\n\n{transcript_text}"}
    ]
    initial_segments = send_to_openrouter(messages_step2, model=model_extract)
    print("Initial segments extracted.")

    # ---------------------------------------------------------
    # STEP 3: VERIFY & REFINE
    # ---------------------------------------------------------
    print(f"--- Step 3: Verifying and Refining ({model_verify}) ---")
    messages_step3 = [
        {"role": "system", "content": prompt_verify},
        {"role": "user", "content": f"ORIGINAL TRANSCRIPT:\n{transcript_text}\n\nDRAFT SEGMENTS:\n{initial_segments}"}
    ]
    final_segments = send_to_openrouter(messages_step3, model=model_verify)
    print("Final verification complete.")

    final_report = f"{final_segments}\n\n---\n\n# Full Transcript\n{transcript_text}"
    
    return {
        "transcript": transcript_text,
        "segments": final_segments,
        "markdown_report": final_report
    }

