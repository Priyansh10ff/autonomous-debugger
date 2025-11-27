from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from sandbox import SecureSandbox
from ai_agent import analyze_code

app = FastAPI()

# Allow Frontend to talk to Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

sandbox = SecureSandbox()

class RunRequest(BaseModel):
    code: str
    language: str

class DebugRequest(BaseModel):
    code: str
    language: str
    logs: str
    model: str

@app.post("/run")
async def run_code(req: RunRequest):
    return sandbox.run_code(req.code, req.language)

@app.post("/debug")
async def debug_code(req: DebugRequest):
    # One-shot repair for demo (can be looped)
    result = analyze_code(req.code, req.logs, req.language, req.model)
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)