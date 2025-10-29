from fastapi import FastAPI, HTTPException, Depends
from sqlmodel import SQLModel, Field, Session, create_engine, select
from typing import List, Optional
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
import os

# choose DB url from env var if present, otherwise local sqlite (dev)
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL:
    sqlite_url = DATABASE_URL  # should be a full SQLAlchemy URL for postgres e.g. postgres://...
else:
    sqlite_file_name = "database.db"
    sqlite_url = f"sqlite:///{sqlite_file_name}"

engine = create_engine(sqlite_url, echo=True)


# -----------------------------
# SQLModel model
# -----------------------------
class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    done: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

# -----------------------------
# Pydantic / SQLModel models
# -----------------------------
class TaskCreate(SQLModel):
    title: str
    done: bool = False

class TaskRead(SQLModel):
    id: int
    title: str
    done: bool
    created_at: datetime

    class Config:
        orm_mode = True

class TaskUpdate(SQLModel):
    title: Optional[str] = None
    done: Optional[bool] = None

# -----------------------------
# App and DB session
# -----------------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://hello-react-hgne.onrender.com"],  # React URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_session():
    with Session(engine) as session:
        yield session

@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)

# -----------------------------
# CRUD Endpoints
# -----------------------------

# CREATE
@app.post("/tasks", response_model=TaskRead)
def create_task(task: TaskCreate, session: Session = Depends(get_session)):
    db_task = Task(**task.model_dump())
    session.add(db_task)
    session.commit()
    session.refresh(db_task)
    return TaskRead.model_validate(db_task, from_attributes=True)

# READ ALL
@app.get("/tasks", response_model=List[TaskRead])
def read_tasks(session: Session = Depends(get_session)):
    return session.exec(select(Task).order_by(Task.id)).all()

# READ ONE
@app.get("/tasks/{task_id}", response_model=TaskRead)
def read_task(task_id: int, session: Session = Depends(get_session)):
    db_task = session.get(Task, task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    return TaskRead.model_validate(db_task, from_attributes=True)

# UPDATE (partial)
@app.patch("/tasks/{task_id}", response_model=TaskRead)
def update_task(task_id: int, task_update: TaskUpdate, session: Session = Depends(get_session)):
    db_task = session.get(Task, task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = task_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_task, key, value)

    session.add(db_task)
    session.commit()
    session.refresh(db_task)
    return TaskRead.model_validate(db_task, from_attributes=True)

# DELETE
@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, session: Session = Depends(get_session)):
    db_task = session.get(Task, task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    session.delete(db_task)
    session.commit()
    return {"detail": "Task deleted successfully"}
