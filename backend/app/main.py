from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import farm
from app.api.routes import crop
from app.api.routes import observation
from app.api.routes import auth
from app.api.routes import options
from app.core.config import settings
from app.core.exceptions import AppException
from app.core.exception_handlers import app_exception_handler

app = FastAPI(
    title=settings.APP_NAME,
    description="A task management backend built with FastAPI",
    version=settings.APP_VERSION
)

# ── CORS ──────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(
    AppException,
    app_exception_handler
)


app.include_router(
    auth.router,
    prefix="/api/v1"
)
app.include_router(
    options.router,
    prefix="/api/v1"
)

app.include_router(
    farm.router,
    prefix="/api/v1"
)
app.include_router(
    crop.router,
    prefix="/api/v1"
)
app.include_router(
    observation.router,
    prefix="/api/v1"
)



@app.get("/")
def root():
    return {
         "message": f"{settings.APP_NAME} is running"
    }