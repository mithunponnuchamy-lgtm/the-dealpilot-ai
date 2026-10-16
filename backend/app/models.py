from datetime import datetime, timezone
from uuid import uuid4
from sqlalchemy import String, Integer, JSON, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base

def uid(): return str(uuid4())
def now(): return datetime.now(timezone.utc).isoformat()
class Deal(Base):
    __tablename__ = 'deals'
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    title: Mapped[str] = mapped_column(String(160))
    client: Mapped[str] = mapped_column(String(100))
    freelancer: Mapped[str] = mapped_column(String(100))
    client_hash: Mapped[str] = mapped_column(String(64), unique=True)
    minimum_cents: Mapped[int] = mapped_column(Integer)
    asking_cents: Mapped[int] = mapped_column(Integer)
    current_version: Mapped[int] = mapped_column(default=0)
    frozen: Mapped[bool] = mapped_column(default=False)
    cancelled: Mapped[bool] = mapped_column(default=False)
    requirements: Mapped[str] = mapped_column(default='')
    extraction: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[str] = mapped_column(default=now)
class Offer(Base):
    __tablename__ = 'offers'
    __table_args__ = (UniqueConstraint('deal_id','version'),)
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    deal_id: Mapped[str] = mapped_column(ForeignKey('deals.id'))
    version: Mapped[int]
    terms: Mapped[dict] = mapped_column(JSON)
    author: Mapped[str]
    rejected: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[str] = mapped_column(default=now)
class Approval(Base):
    __tablename__ = 'approvals'
    __table_args__ = (UniqueConstraint('offer_id','role'),)
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    offer_id: Mapped[str] = mapped_column(ForeignKey('offers.id'))
    role: Mapped[str]
    created_at: Mapped[str] = mapped_column(default=now)
class Payment(Base):
    __tablename__ = 'payments'
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    deal_id: Mapped[str] = mapped_column(ForeignKey('deals.id'), unique=True)
    offer_id: Mapped[str] = mapped_column(ForeignKey('offers.id'), unique=True)
    order_id: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
    capture_id: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
    status: Mapped[str] = mapped_column(default='creating')
    approval_url: Mapped[str | None] = mapped_column(nullable=True)
    created_at: Mapped[str] = mapped_column(default=now)
    paid_at: Mapped[str | None] = mapped_column(nullable=True)
class Event(Base):
    __tablename__ = 'events'
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    deal_id: Mapped[str] = mapped_column(ForeignKey('deals.id'))
    role: Mapped[str]
    message: Mapped[str]
    created_at: Mapped[str] = mapped_column(default=now)
