"""
File Upload Utility
Handles file uploads to Supabase Storage
"""

from fastapi import UploadFile, HTTPException, status
import os
from typing import Optional
import aiofiles
from datetime import datetime
import uuid
from app.utils.supabase_storage import upload_file_to_supabase_async, delete_file_from_supabase

# File size limit (10MB)
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", 10485760))

# Allowed file types
ALLOWED_FILE_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/heic",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]

# Allowed extensions
ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png", "gif", "webp", "heic", "doc", "docx", "xls", "xlsx"]


async def validate_file(file: UploadFile) -> bool:
    """Validate file type and size"""
    
    # Check file extension
    file_ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Check file size
    # Read file content in chunks synchronously
    file_size = 0
    while True:
        chunk = file.file.read(1024 * 1024)  # 1 MiB per iteration
        if not chunk:
            break
        file_size += len(chunk)
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds limit ({MAX_FILE_SIZE / 1024 / 1024:.1f}MB)"
            )
    
    # Reset file pointer
    await file.seek(0)
    
    return True


async def save_upload_file(file: UploadFile, user_id: str, entity_type: str) -> dict:
    """
    Save uploaded file to Supabase Storage
    
    Args:
        file: Uploaded file
        user_id: User ID for organizing files
        entity_type: Type of entity (expense, transaction)
        
    Returns:
        Dict with file_name, file_path, file_url, file_type, file_size
    """
    
    # Validate file
    await validate_file(file)
    
    # Determine bucket name based on entity type (use the actual bucket names you have created)
    bucket_mapping = {
        "expense": "expense-medias",
        "transaction": "transaction-medias",
    }
    bucket_name = bucket_mapping.get(entity_type, f"{entity_type}-media")
    
    # Read file content
    file_content = await file.read()
    
    # Upload to Supabase Storage (async)
    file_data = await upload_file_to_supabase_async(
        file_content=file_content,
        file_name=file.filename,
        bucket_name=bucket_name,
        user_id=user_id,
        entity_type=entity_type
    )
    
    # Add file type
    file_ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    file_data["file_type"] = get_file_type(file_ext)
    
    return file_data


def get_file_type(extension: str) -> str:
    """Get file type category from extension"""
    if extension.lower() in ["jpg", "jpeg", "png", "gif", "webp", "heic"]:
        return "IMAGE"
    elif extension.lower() == "pdf":
        return "PDF"
    elif extension.lower() in ["doc", "docx"]:
        return "DOCUMENT"
    elif extension.lower() in ["xls", "xlsx"]:
        return "SPREADSHEET"
    return "OTHER"


def delete_file(file_path: str, bucket_name: str = "expense-medias") -> bool:
    """Delete file from Supabase Storage"""
    return delete_file_from_supabase(file_path, bucket_name)
