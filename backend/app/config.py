import os
from pathlib import Path
from dotenv import load_dotenv
env_backend = Path(__file__).resolve().parent.parent / '.env'
if env_backend.exists():
    load_dotenv(dotenv_path=env_backend)
load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./dealpilot.db')
if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql+psycopg://', 1)
elif DATABASE_URL.startswith('postgresql://') and not DATABASE_URL.startswith('postgresql+psycopg://'):
    DATABASE_URL = DATABASE_URL.replace('postgresql://', 'postgresql+psycopg://', 1)

FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000').rstrip('/')
WORKSPACE_TOKEN = (os.getenv('WORKSPACE_TOKEN', '') or '').strip() or 'l23kTxGL6jBc21F0AMTvB2A6VYJfzco0VcqBqsZxTlbz2qGi'
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'gemini-3.5-flash-lite')
