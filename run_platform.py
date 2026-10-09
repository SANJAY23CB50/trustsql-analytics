import subprocess
import sys
import time
import os
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent

def main():
    print("=" * 70)
    print("🚀 Starting QueryCraft AI - Natural Language to SQL Analytics Platform")
    print("=" * 70)

    # 1. Start FastAPI Backend
    print("[1/2] Launching FastAPI Backend on http://localhost:8000 ...")
    backend_cmd = [sys.executable, "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
    backend_proc = subprocess.Popen(backend_cmd, cwd=str(ROOT_DIR))

    # 2. Start Vite Frontend
    print("[2/2] Launching React Frontend on http://localhost:5173 ...")
    frontend_dir = ROOT_DIR / "frontend"
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    frontend_proc = subprocess.Popen([npm_cmd, "run", "dev", "--", "--host"], cwd=str(frontend_dir))

    print("\n" + "=" * 70)
    print("✅ System Online!")
    print("👉 Frontend Dashboard: http://localhost:5173")
    print("👉 Backend Swagger API: http://localhost:8000/docs")
    print("=" * 70 + "\n")
    print("Press Ctrl+C to terminate both servers.")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down servers...")
        backend_proc.terminate()
        frontend_proc.terminate()
        print("Shutdown complete.")

if __name__ == "__main__":
    main()
