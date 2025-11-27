import docker
import tempfile
import os
import shutil
import re

class SecureSandbox:
    def __init__(self):
        # Initialize attribute to None to strictly prevent 'AttributeError'
        self.client = None

    def _get_docker_client(self):
        """Attempts to connect to Docker Daemon on demand."""
        try:
            client = docker.from_env()
            client.ping() # Check if actually responsive
            return client
        except Exception:
            return None

    def _detect_language(self, code: str) -> str:
        """Heuristic to auto-detect language based on code syntax."""
        code = code.strip()
        
        # Java detection
        if re.search(r'public\s+class\s+\w+', code) or 'System.out.println' in code:
            return 'java'
        
        # C++ detection
        if '#include' in code and ('<iostream>' in code or '<vector>' in code):
            return 'cpp'
            
        # Python detection (def function, import without semicolon, print without semicolon)
        if re.search(r'def\s+\w+\(.*\):', code) or (code.startswith('import ') and ';' not in code.split('\n')[0]):
            return 'python'
            
        # JavaScript detection
        if 'console.log' in code or re.search(r'function\s+\w+\(.*\)\s*{', code):
            return 'javascript'
            
        return None

    def run_code(self, code: str, language: str):
        # 1. Connect to Docker (Lazy Loading)
        client = self._get_docker_client()
        
        if not client:
            return {
                "exit_code": 1, 
                "logs": "❌ SYSTEM ERROR: Docker is not running.\n\n1. Open 'Docker Desktop'.\n2. Wait for it to start completely.\n3. Try running the code again."
            }

        # 2. Auto-Detect Language Override
        detected_lang = self._detect_language(code)
        if detected_lang and detected_lang != language:
            # We silently switch to the correct language to prevent syntax errors
            language = detected_lang

        config = {
            'python': {'image': 'python:3.10-slim', 'cmd': 'python -u', 'ext': '.py'},
            'javascript': {'image': 'node:18-alpine', 'cmd': 'node', 'ext': '.js'},
            'cpp': {'image': 'gcc:latest', 'cmd': 'g++ -o app main.cpp && ./app', 'ext': '.cpp'},
            # Updated to use Eclipse Temurin (Standard OpenJDK) to fix 404 errors
            'java': {'image': 'eclipse-temurin:17-jdk', 'cmd': 'javac main.java && java main', 'ext': '.java'}
        }
        
        if language not in config:
            return {"exit_code": 1, "logs": f"Language '{language}' not supported in sandbox."}

        cfg = config[language]
        
        try:
            with tempfile.TemporaryDirectory() as temp_dir:
                filename = f"main{cfg['ext']}"
                file_path = os.path.join(temp_dir, filename)
                
                # Write user code to the temp file
                with open(file_path, 'w') as f:
                    f.write(code)

                # 3. Run in Secure Container
                container = client.containers.run(
                    image=cfg['image'],
                    command=f"sh -c '{cfg['cmd']} /app/{filename} 2>&1'", 
                    volumes={temp_dir: {'bind': '/app', 'mode': 'rw'}},
                    working_dir='/app',
                    network_disabled=True, 
                    mem_limit='128m',
                    detach=True
                )
                
                try:
                    result = container.wait(timeout=10) # 10s Execution Limit
                    logs = container.logs().decode('utf-8')
                    exit_code = result['StatusCode']
                except Exception as e:
                    container.kill()
                    return {"exit_code": 1, "logs": f"⏱️ Execution Timed Out (Limit: 10s)\nError: {str(e)}"}
                finally:
                    container.remove()
                
                return {"exit_code": exit_code, "logs": logs}
                
        except docker.errors.ImageNotFound:
            return {"exit_code": 1, "logs": f"❌ Setup Error: Docker image '{cfg['image']}' not found.\nTrying to download it now... Please click Run again in 30 seconds.\n(Or run 'docker pull {cfg['image']}' in your terminal)"}
        except Exception as e:
            return {"exit_code": 1, "logs": f"❌ Sandbox Error: {str(e)}"}