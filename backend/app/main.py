from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from .database import engine
from .config import FRONTEND_URL
app = FastAPI(title='DealPilot AI', version='0.1.0')
origins = list(set([FRONTEND_URL, 'http://localhost:3000', 'http://127.0.0.1:3000']))
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=['GET','POST'], allow_headers=['Authorization','Content-Type'])
@app.get('/health')
def health():
    with engine.connect() as conn:
        conn.execute(text('SELECT 1'))
    return {'status': 'ok', 'database': 'connected', 'payments': 'sandbox only'}
from contextlib import asynccontextmanager
from .database import Base
from . import models
from .routes import router
@asynccontextmanager
async def lifespan(app):
    Base.metadata.create_all(engine)
    yield
app.router.lifespan_context = lifespan
app.include_router(router)
