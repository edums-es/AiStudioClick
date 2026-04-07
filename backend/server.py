from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware
import os
import logging

from core.database import init_db, close_db
from routers import auth, agents, templates, skills, integrations, executions, mindmap, dashboard, n8n as n8n_router, workspace
from seeds.seed import run_seed

app = FastAPI(title="AI Studio Click Massa", version="1.0.0")

frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:3000", "http://localhost:3001"],
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

app.include_router(api_router)


@app.on_event("startup")
async def startup():
    db = init_db()
    await run_seed(db)


@app.on_event("shutdown")
async def shutdown():
    close_db()


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)
