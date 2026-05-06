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
    file_size = 0
    async for chunk in file.file:
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
    Save uploaded file to local storage
    
    Args:
        file: Uploaded file
        user_id: User ID for organizing files
        entity_type: Type of entity (expense, transaction)
        
    Returns:
        Dict with file_name, file_path, file_type, file_size
    """
    
    # Validate file
    await validate_file(file)
    
    # Create directory structure
    upload_dir = f"uploads/{user_id}/{entity_type}/{datetime.now().year}/{datetime.now().month}"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    file_ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    unique_filename = f"{uuid.uuid4()}.{file_ext}"
    file_path = os.path.join(upload_dir, unique_filename)
    
    # Save file
    content = await file.read()
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)
    
    return {
        "file_name": file.filename,
        "file_path": file_path,
        "file_type": get_file_type(file_ext),
        "file_size": len(content),
    }


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


def delete_file(file_path: str) -> bool:
    """Delete file from storage"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False
    except Exception as e:
        print(f"Error deleting file: {e}")
        return False
