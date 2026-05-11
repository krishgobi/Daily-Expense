"""
Report Routes
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import date, datetime
from uuid import UUID
import tempfile
import os

from app.database.connection import get_db
from app.dependencies import get_current_user_id
from uuid import UUID
from app.schemas import ReportCreate, ReportResponse
from app.services.report_service import ReportService
from app.reports.pdf_generator import PDFReportGenerator
from app.reports.excel_generator import ExcelReportGenerator
from app.reports.word_generator import WordReportGenerator
from app.exceptions import AppException
from app.models import User


router = APIRouter()


@router.post("/generate", response_model=dict, tags=["reports"])
async def generate_report(
    report_data: ReportCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Generate a report in the specified format."""
    try:
        user_uuid = UUID(user_id)
        # Fetch user for report generation (name/email)
        user = db.query(User).filter(User.id == user_uuid).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        # Create report record

        report = ReportService.create_report(
            db,
            user_uuid,
            report_data.report_type,
            report_data.period_start,
            report_data.period_end,
        )

        # Gather data
        data = ReportService.gather_report_data(
            db,
            user_uuid,
            report_data.period_start,
            report_data.period_end,
        )

        # Generate file based on format
        user_name = user.full_name or user.email
        if report_data.format == "PDF":
            file_content = PDFReportGenerator.generate(data, user_name)
            file_ext = "pdf"
            content_type = "application/pdf"
        elif report_data.format == "EXCEL":
            file_content = ExcelReportGenerator.generate(data, user_name)
            file_ext = "xlsx"
            content_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        elif report_data.format == "WORD":
            file_content = WordReportGenerator.generate(data, user_name)

            file_ext = "docx"
            content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        else:
            raise AppException("Invalid report format")

        # Save file
        temp_dir = tempfile.gettempdir()
        file_path = os.path.join(temp_dir, f"report_{report.id}.{file_ext}")
        with open(file_path, "wb") as f:
            f.write(file_content)

        # Update report with file path
        ReportService.update_report(
            db,
            report.id,
            data["total_expenses"],
            data["total_borrowed"],
            data["total_lent"],
            file_path,
        )

        return {
            "status": "success",
            "data": ReportResponse.from_orm(report),
            "message": "Report generated successfully",
        }
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=dict, tags=["reports"])
async def list_reports(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """List all reports for current user."""
    try:
        user_uuid = UUID(user_id)
        reports, total = ReportService.get_user_reports(db, user_uuid, limit, offset)
        return {
            "status": "success",
            "data": [ReportResponse.from_orm(r) for r in reports],
            "meta": {
                "total": total,
                "limit": limit,
                "offset": offset,
            },
            "message": "Reports retrieved successfully",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{report_id}", response_model=dict, tags=["reports"])
async def get_report(
    report_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get a specific report."""
    try:
        user_uuid = UUID(user_id)
        report = ReportService.get_report(db, user_uuid, UUID(report_id))
        return {
            "status": "success",
            "data": ReportResponse.from_orm(report),
            "message": "Report retrieved successfully",
        }
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{report_id}/download", tags=["reports"])
async def download_report(
    report_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Download a generated report."""
    try:
        user_uuid = UUID(user_id)
        report = ReportService.get_report(db, user_uuid, UUID(report_id))

        if not report.file_path or not os.path.exists(report.file_path):
            raise HTTPException(status_code=404, detail="Report file not found")

        # Determine content type
        if report.file_path.endswith(".pdf"):
            content_type = "application/pdf"
            ext = "pdf"
        elif report.file_path.endswith(".xlsx"):
            content_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            ext = "xlsx"
        elif report.file_path.endswith(".docx"):
            content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            ext = "docx"
        else:
            content_type = "application/octet-stream"
            ext = "bin"

        filename = f"expense_report_{report.period_start}_{report.period_end}.{ext}"

        return FileResponse(
            path=report.file_path,
            media_type=content_type,
            filename=filename,
        )
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{report_id}", response_model=dict, tags=["reports"])
async def delete_report(
    report_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Delete a report."""
    try:
        user_uuid = UUID(user_id)
        result = ReportService.delete_report(db, user_uuid, UUID(report_id))
        return {
            "status": "success",
            "data": result,
            "message": "Report deleted successfully",
        }
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
