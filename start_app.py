import subprocess
import os
import sys
import time
import platform
import signal

# --- Configuration ---
ROOT_DIR = os.getcwd()
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")

# Store running processes to kill them later
processes = []

def log(msg, symbol="ℹ️"):
    print(f"{symbol}  [DevForge Launcher] {msg}")

def is_windows():
    return platform.system() == "Windows"

def check_docker():
    """Checks if Docker Desktop/Daemon is running."""
    log("Checking Docker status...", "🐳")
    try:
        # 'docker info' is a reliable check for the daemon
        subprocess.run(["docker", "info"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        log("Docker is running.", "✅")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        log("Docker is NOT running.", "❌")
        print("\n    Please start 'Docker Desktop' manually and wait for it to initialize.")
        print("    Press [Enter] here once Docker is running...")
        input()
        return check_docker()

def find_python_executable():
    """Finds the venv python if it exists, else system python."""
    # Common venv locations
    venv_paths = [
        os.path.join(BACKEND_DIR, "venv", "Scripts", "python.exe"), # Windows
        os.path.join(BACKEND_DIR, "venv", "bin", "python"),         # Mac/Linux
        os.path.join(ROOT_DIR, "venv", "Scripts", "python.exe"),
        os.path.join(ROOT_DIR, "venv", "bin", "python"),
    ]
    
    for path in venv_paths:
        if os.path.exists(path):
            log(f"Using Virtual Environment: {path}", "🐍")
            return path
            
    log("No venv found, using system Python.", "⚠️")
    return sys.executable

def start_service(command, cwd, name, color_code="37"):
    """Starts a subprocess and appends to list."""
    log(f"Starting {name}...", "🚀")
    
    try:
        # We use shell=True on Windows to handle commands like 'npm' correctly
        # We start them in new process groups (if possible) to clean up easier
        proc = subprocess.Popen(
            command,
            cwd=cwd,
            shell=is_windows(),
            # We let stdout/stderr flow to the main console so the user sees logs
            # In a real GUI app we might capture this, but for a dev script, seeing logs is good.
        )
        processes.append((name, proc))
        return proc
    except Exception as e:
        log(f"Failed to start {name}: {e}", "❌")
        sys.exit(1)

def cleanup():
    """Kills all started processes."""
    print("\n")
    log("Shutting down services...", "🛑")
    
    for name, proc in processes:
        try:
            if is_windows():
                # Windows requires taskkill to force kill the process tree (including shell wrappers)
                subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            else:
                os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
        except Exception:
            pass # Process might already be dead
    
    log("All services stopped. Goodbye!", "👋")

def main():
    # 1. Check Docker
    if not check_docker():
        return

    # 2. Start Ollama (Serve)
    # We try to start it. If it's already running, it might error or just stay quiet, which is fine.
    try:
        log("Ensuring Ollama is running...", "🦙")
        # Start ollama in background
        start_service(["ollama", "serve"], ROOT_DIR, "Ollama")
    except Exception:
        log("Ollama might already be running.", "⚠️")

    time.sleep(2) # Give Ollama a moment

    # 3. Start Backend
    python_exec = find_python_executable()
    # We run main.py which starts uvicorn
    start_service([python_exec, "main.py"], BACKEND_DIR, "Backend (FastAPI)")

    time.sleep(2) # Give Backend a moment to bind port

    # 4. Start Frontend
    # Ensure npm install was run at least once? We assume yes based on history.
    if not os.path.exists(os.path.join(FRONTEND_DIR, "node_modules")):
        log("node_modules not found. Running 'npm install' first...", "📦")
        subprocess.run(["npm", "install"], cwd=FRONTEND_DIR, shell=is_windows(), check=True)

    start_service(["npm", "run", "dev"], FRONTEND_DIR, "Frontend (React)")

    print("\n" + "="*50)
    print("   DEVFORGE ENVIRONMENT RUNNING")
    print("   Frontend: http://localhost:5173")
    print("   Backend:  http://localhost:8000")
    print("   Press Ctrl+C to stop everything")
    print("="*50 + "\n")

    try:
        # Keep script alive to monitor
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        cleanup()

if __name__ == "__main__":
    main()