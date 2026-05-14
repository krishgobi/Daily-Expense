"""
Database Models
Core data structures for the application
"""

from sqlalchemy import Column, String, DateTime, Float, Enum, ForeignKey, Integer, Text, Boolean, Date, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.database.connection import Base


class User(Base):
    """User Model"""

    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255))
    currency_code = Column(String(3), default="INR")
    timezone = Column(String(50), default="Asia/Kolkata")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    # Relationships
    expenses = relationship("Expense", back_populates="user", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    categories = relationship("ExpenseCategory", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User {self.email}>"


class ExpenseCategory(Base):
    """Expense Category Model"""

    __tablename__ = "expense_categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(50), nullable=False)
    icon = Column(String(50))
    color = Column(String(7))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="categories")
    expenses = relationship("Expense", back_populates="category", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ExpenseCategory {self.name}>"


class Expense(Base):
    """Expense Model"""

    __tablename__ = "expenses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(UUID(as_uuid=True), ForeignKey("expense_categories.id"), nullable=True)
    type = Column(String(20), nullable=False)  # CASH or DIGITAL
    purpose = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(Text)
    date = Column(Date, nullable=False, index=True)
    location = Column(String(255))
    payment_method = Column(String(50))  # GPay, PhonePe, UPI, Bank, etc.
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="expenses")
    category = relationship("ExpenseCategory", back_populates="expenses")
    media = relationship("ExpenseMedia", back_populates="expense", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Expense {self.purpose} - {self.amount}>"


class ExpenseMedia(Base):
    """Expense Media/Proof Model"""

    __tablename__ = "expense_media"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    expense_id = Column(UUID(as_uuid=True), ForeignKey("expenses.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_url = Column(String(1000), nullable=True)  # Public URL from Supabase Storage
    file_type = Column(String(20))  # PDF, IMAGE, SCREENSHOT
    file_size = Column(Integer)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    expense = relationship("Expense", back_populates="media")

    def __repr__(self):
        return f"<ExpenseMedia {self.file_name}>"


class Transaction(Base):
    """Borrowed/Lent Money Transaction Model"""

    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    transaction_type = Column(String(20), nullable=False)  # BORROWED or LENT
    person_name = Column(String(255), nullable=False)
    purpose = Column(String(255))
    amount = Column(Float, nullable=False)
    given_date = Column(Date, nullable=False)
    expected_return_date = Column(Date, nullable=True, index=True)
    actual_return_date = Column(Date, nullable=True)
    status = Column(String(20), default="PENDING")  # PENDING or COMPLETED
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="transactions")
    media = relationship("TransactionMedia", back_populates="transaction", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Transaction {self.transaction_type} - {self.person_name} - {self.amount}>"


class TransactionMedia(Base):
    """Transaction Media/Proof Model"""

    __tablename__ = "transaction_media"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transaction_id = Column(UUID(as_uuid=True), ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_url = Column(String(1000), nullable=True)  # Public URL from Supabase Storage
    file_type = Column(String(20))
    file_size = Column(Integer)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    transaction = relationship("Transaction", back_populates="media")

    def __repr__(self):
        return f"<TransactionMedia {self.file_name}>"


class Report(Base):
    """Generated Report Metadata Model"""

    __tablename__ = "reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    report_type = Column(String(50), nullable=False)  # MONTHLY, QUARTERLY, YEARLY
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    total_expenses = Column(Float)
    total_borrowed = Column(Float)
    total_lent = Column(Float)
    file_path = Column(String(500))
    generated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="reports")

    def __repr__(self):
        return f"<Report {self.report_type} - {self.period_start} to {self.period_end}>"


class Conversation(Base):
    """Chat Conversation Model"""

    __tablename__ = "conversations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    title = Column(String(255), default="New Chat")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Conversation {self.title}>"


class Message(Base):
    """Chat Message Model"""

    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), nullable=False)   # "user" or "assistant"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    conversation = relationship("Conversation", back_populates="messages")

    def __repr__(self):
        return f"<Message {self.role[:4]} - {self.content[:30]}>"


class AuditLog(Base):
    """Audit Log Model"""

    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50))
    entity_id = Column(UUID(as_uuid=True))
    old_value = Column(JSON)
    new_value = Column(JSON)
    ip_address = Column(String(45))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    user = relationship("User", back_populates="audit_logs")

    def __repr__(self):
        return f"<AuditLog {self.action} - {self.entity_type}>"
