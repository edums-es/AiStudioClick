from dotenv import load_dotenv
load_dotenv()

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from core.database import init_db, close_db
from routers import auth, agents, templates, skills, integrations, executions, mindmap, dashboard, n8n as n8n_router, workspace, webhook
from routers.auth import limiter as auth_limiter
from seeds.seed import run_seed

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    db = init_db()
    await run_seed(db)
    yield
    close_db()


app = FastAPI(title="AI Studio Click Massa", version="1.0.0", lifespan=lifespan)

# Rate limiting
app.state.limiter = auth_limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
frontend_url = os.environ.get("FRONTEND_URL", "")
if not frontend_url:
    logger.warning("⚠️  FRONTEND_URL não definido — CORS permitindo apenas localhost")

allowed_origins = [o for o in [frontend_url, "http://localhost:3000", "http://localhost:3001"] if o]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(agents.router, prefix="/agents", tags=["agents"])
api_router.include_router(templates.router, prefix="/templates", tags=["templates"])
api_router.include_router(skills.router, prefix="/skills", tags=["skills"])
api_router.include_router(integrations.router, prefix="/integrations", tags=["integrations"])
api_router.include_router(executions.router, prefix="/executions", tags=["executions"])
api_router.include_router(mindmap.router, prefix="/mindmap", tags=["mindmap"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(n8n_router.router, prefix="/n8n", tags=["n8n"])
api_router.include_router(workspace.router, prefix="/workspace", tags=["workspace"])
api_router.include_router(webhook.router, prefix="/webhook", tags=["webhook"])

app.include_router(api_router)
