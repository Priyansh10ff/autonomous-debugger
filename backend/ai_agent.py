import ollama
import json
from pydantic import BaseModel

class DebugResponse(BaseModel):
    analysis: str
    fixed_code: str

def analyze_code(code: str, logs: str, language: str, model="qwen2.5-coder"):
    # Professional System Prompt
    prompt = f"""
    You are a Senior Software Engineer and Static Analysis Tool.
    Your task is to analyze the following {language} code and execution logs to diagnose the issue professionally.
    
    CONTEXT:
    - User Code ({language}):
    {code}
    
    - Execution Output/Errors:
    {logs}
    
    INSTRUCTIONS:
    1. **Professional Tone**: Adopt a formal, technical tone similar to VS Code 'Problems' tab or a compiler. Avoid casual language like "I think" or "Maybe".
    2. **Precise Terminology**: Use exact technical terms (e.g., "Infinite Recursion", "IndexOutOfBoundsException", "SyntaxError", "Memory Leak").
    3. **Root Cause Analysis**: Explain *why* the error occurred technically, referring to specific lines or logic states.
    4. **System Error Handling**: If the logs show a system failure (like 'Docker not found' or 'python: can't open file'), state: "Environment Error: The execution environment failed. The code logic may be correct, but the sandbox could not run it."
    5. **Language strictness**: Return corrected code ONLY in {language}.
    
    OUTPUT STRUCTURE (JSON):
    - "analysis": A structured Markdown string. Use bold headers like **Error:**, **Root Cause:**, and **Fix:**.
    - "fixed_code": The fully corrected, compilable code.
    """
    
    try:
        response = ollama.chat(
            model=model,
            messages=[{'role': 'user', 'content': prompt}],
            format=DebugResponse.model_json_schema(),
            options={'temperature': 0.1} # Low temperature for factual consistency
        )
        return json.loads(response['message']['content'])
    except Exception as e:
        return {
            "analysis": f"**Internal Agent Error:** Failed to generate analysis.\n\nDetails: {str(e)}", 
            "fixed_code": code
        }