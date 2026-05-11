"""
Pydantic Schemas
Request/Response validation models
"""

from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, date
from typing import Optional, List
from uuid import UUID


# ============ User Schemas ============

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    currency_code: str = "INR"
    timezone: str = "Asia/Kolkata"


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    currency_code: Optional[str] = None
    timezone: Optional[str] = None


class UserResponse(UserBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============ Auth Schemas ============

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: int


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ============ Category Schemas ============

class CategoryBase(BaseModel):
    name: str = Field(..., max_length=50)
    icon: Optional[str] = None
    color: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryResponse(CategoryBase):
    id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# ============ Expense Schemas ============

class ExpenseBase(BaseModel):
    purpose: str = Field(..., max_length=255)
    amount: float = Field(..., gt=0)
    description: Optional[str] = None
    date: date
    location: Optional[str] = None


class CashExpenseCreate(ExpenseBase):
    pass


class DigitalExpenseCreate(ExpenseBase):
    payment_method: str = Field(..., max_length=50)


class ExpenseUpdate(BaseModel):
    purpose: Optional[str] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    location: Optional[str] = None
    payment_method: Optional[str] = None


class ExpenseResponse(ExpenseBase):
    id: UUID
    user_id: UUID
    type: str
    category_id: Optional[UUID] = None
    payment_method: Optional[str] = None
    media: Optional[List['MediaResponse']] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============ Media Schemas ============

class MediaResponse(BaseModel):
    id: UUID
    file_name: str
    file_path: str
    file_url: Optional[str] = None
    file_type: str
    file_size: int
    uploaded_at: datetime

    class Config:
        from_attributes = True


# ============ Transaction Schemas ============

class TransactionBase(BaseModel):
    transaction_type: str
    person_name: str = Field(..., max_length=255)
    amount: float = Field(..., gt=0)
    given_date: date
    expected_return_date: Optional[date] = None
    purpose: Optional[str] = None


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    transaction_type: Optional[str] = None
    person_name: Optional[str] = None
    amount: Optional[float] = None
    given_date: Optional[date] = None
    expected_return_date: Optional[date] = None
    purpose: Optional[str] = None


class TransactionCompleteRequest(BaseModel):
    actual_return_date: date


class TransactionResponse(TransactionBase):
    id: UUID
    user_id: UUID
    status: str
    media: Optional[List['MediaResponse']] = None
    actual_return_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============ Report Schemas ============

class ReportCreate(BaseModel):
    report_type: str
    period_start: date
    period_end: date
    format: str = "PDF"


class ReportResponse(BaseModel):
    id: UUID
    user_id: UUID
    report_type: str
    period_start: date
    period_end: date
    total_expenses: Optional[float] = None
    total_borrowed: Optional[float] = None
    total_lent: Optional[float] = None
    generated_at: datetime

    class Config:
        from_attributes = True


# ============ Dashboard Schemas ============

class ExpenseSummary(BaseModel):
    total: float
    count: int
    trend: Optional[str] = None


class DashboardResponse(BaseModel):
    today: ExpenseSummary
    week: ExpenseSummary
    month: ExpenseSummary
    year: ExpenseSummary


# ============ API Response Wrapper ============

class ApiResponse(BaseModel):
    status: str = "success"
    data: Optional[dict] = None
    message: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ApiErrorResponse(BaseModel):
    status: str = "error"
    code: str
    message: str
    details: Optional[dict] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
