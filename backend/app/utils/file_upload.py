"""
File Upload Utility
Handles file uploads to Supabase Storage
"""

from fastapi import UploadFile, HTTPException, status
import os
from app.utils.supabase_storage import upload_file_to_supabase_async, delete_file_from_supabase

MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", 10485760))  # 10 MB

ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png", "gif", "webp", "heic", "doc", "docx", "xls", "xlsx"]

BUCKET_MAP = {
    "expense":     "expense-media",
    "transaction": "transaction-media",
}


async def save_upload_file(file: UploadFile, user_id: str, entity_type: str) -> dict:
    """Validate, read, and upload a file to Supabase Storage."""

    file_ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    content = await file.read()

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds {MAX_FILE_SIZE / 1024 / 1024:.0f} MB limit"
        )

    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty")

    bucket_name = BUCKET_MAP.get(entity_type, f"{entity_type}-media")

    file_data = await upload_file_to_supabase_async(
        file_content=content,
        file_name=file.filename,
        bucket_name=bucket_name,
        user_id=user_id,
        entity_type=entity_type,
    )

    file_data["file_type"] = get_file_type(file_ext)
    return file_data


def get_file_type(extension: str) -> str:
    if extension.lower() in ["jpg", "jpeg", "png", "gif", "webp", "heic"]:
        return "IMAGE"
    if extension.lower() == "pdf":
        return "PDF"
    if extension.lower() in ["doc", "docx"]:
        return "DOCUMENT"
    if extension.lower() in ["xls", "xlsx"]:
        return "SPREADSHEET"
    return "OTHER"


def delete_file(file_path: str, bucket_name: str = "expense-media") -> bool:
    return delete_file_from_supabase(file_path, bucket_name)
