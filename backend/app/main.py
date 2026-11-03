from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from .database import engine, Base
from .config import FRONTEND_URL
from . import models
from .routes import router

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(engine)
    try:
        with engine.begin() as conn:
            conn.execute(text('ALTER TABLE payments ADD COLUMN IF NOT EXISTS milestones JSON'))
    except Exception as e:
        print('Migration notice:', e)
    yield

app = FastAPI(title='DealPilot AI', version='0.1.0', lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=False,
    allow_methods=['*'],
    allow_headers=['*'],
)

@app.get('/health')
def health():
    with engine.connect() as conn:
        conn.execute(text('SELECT 1'))
    return {'status': 'ok', 'database': 'connected', 'payments': 'sandbox only'}

app.include_router(router)
