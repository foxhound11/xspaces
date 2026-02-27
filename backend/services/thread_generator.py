"""
Thread Generator Service
Generates tweet thread summaries using a writer/judge feedback loop.
"""
import json
import requests
from typing import Optional
from ..config import ConfigManager

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MAX_ITERATIONS = 3


def _get_api_key():
    """Get API key from environment."""
    import os
    from dotenv import load_dotenv
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    load_dotenv(env_path)
    return os.getenv("OPENROUTER_API_KEY")


def _send_to_openrouter(messages: list, model: str, api_key: str) -> str:
    """Helper to send requests to OpenRouter."""
    headers = {
        "Authorization": f"Bearer {api_key}",
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


def _call_writer(transcript: str, segments: str, prompt: str, model: str, 
                 api_key: str, previous_feedback: Optional[str] = None) -> str:
    """Call the writer LLM to generate a thread draft."""
    
    user_content = f"""# Transcript
{transcript}

# Viral Segments (High-Value Moments)
{segments}"""
    
    if previous_feedback:
        user_content += f"""

# IMPORTANT: Previous Feedback from Quality Judge
Your last draft was rejected. Here's what to fix:
{previous_feedback}

Please rewrite the thread addressing this feedback."""
    
    messages = [
        {"role": "system", "content": prompt},
        {"role": "user", "content": user_content}
    ]
    
    return _send_to_openrouter(messages, model, api_key)


def _call_judge(thread: str, prompt: str, model: str, api_key: str) -> dict:
    """Call the judge LLM to evaluate the thread. Returns parsed JSON."""
    
    messages = [
        {"role": "system", "content": prompt},
        {"role": "user", "content": f"Evaluate this tweet thread:\n\n{thread}"}
    ]
    
    response = _send_to_openrouter(messages, model, api_key)
    
    # Parse JSON from response (handle potential markdown code blocks)
    response_clean = response.strip()
    if response_clean.startswith("```"):
        # Remove markdown code block
        lines = response_clean.split("\n")
        response_clean = "\n".join(lines[1:-1])
    
    try:
        return json.loads(response_clean)
    except json.JSONDecodeError:
        # If parsing fails, assume rejection with generic feedback
        print(f"Warning: Could not parse judge response as JSON: {response}")
        return {
            "approved": False,
            "score": 0,
            "feedback": "Judge response was malformed. Please try again."
        }


def generate_thread(transcript: str, segments: str) -> dict:
    """
    Generate a tweet thread using writer/judge feedback loop.
    
    Returns:
        {
            "thread": str,           # Final thread content
            "iterations": int,       # Number of attempts made
            "approved": bool,        # Whether judge approved
            "feedback_history": list # All feedback received
        }
    """
    api_key = _get_api_key()
    if not api_key:
        raise Exception("OPENROUTER_API_KEY not found in .env")
    
    # Load config
    config = ConfigManager.get_config()
    models = config.get("models", {})
    prompts = config.get("prompts", {})
    
    writer_model = models.get("thread_writer", "google/gemini-2.0-flash-001")
    judge_model = models.get("thread_judge", "google/gemini-2.0-flash-001")
    writer_prompt = prompts.get("thread_writer", "")
    judge_prompt = prompts.get("thread_judge", "")
    
    if not writer_prompt or not judge_prompt:
        raise Exception("Thread writer or judge prompts not configured")
    
    feedback_history = []
    previous_feedback = None
    draft = ""
    approved = False
    
    for iteration in range(1, MAX_ITERATIONS + 1):
        print(f"--- Thread Generation: Iteration {iteration}/{MAX_ITERATIONS} ---")
        
        # Step 1: Generate draft
        print(f"Calling writer ({writer_model})...")
        draft = _call_writer(
            transcript, segments, writer_prompt, writer_model, 
            api_key, previous_feedback
        )
        print("Draft generated.")
        
        # Step 2: Judge the draft
        print(f"Calling judge ({judge_model})...")
        judge_result = _call_judge(draft, judge_prompt, judge_model, api_key)
        print(f"Judge result: approved={judge_result.get('approved')}, score={judge_result.get('score')}")
        
        if judge_result.get("approved", False):
            approved = True
            print("Thread approved!")
            break
        
        # Store feedback for next iteration
        feedback = judge_result.get("feedback", "No specific feedback provided")
        feedback_history.append({
            "iteration": iteration,
            "score": judge_result.get("score", 0),
            "feedback": feedback
        })
        previous_feedback = feedback
        print(f"Thread rejected. Feedback: {feedback}")
    
    if not approved:
        print(f"Max iterations ({MAX_ITERATIONS}) reached. Returning best attempt.")
    
    return {
        "thread": draft,
        "iterations": iteration,
        "approved": approved,
        "feedback_history": feedback_history
    }
