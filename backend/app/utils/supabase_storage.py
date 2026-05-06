"""
Supabase Storage Client
Handles file uploads and storage for the backend
Uses Supabase REST API directly via httpx (no SDK dependency)
"""

import httpx
import os
from typing import Optional
from app.config import settings
from datetime import datetime
import uuid
import base64

# Supabase Storage REST API endpoints
SUPABASE_URL = settings.SUPABASE_URL
SERVICE_KEY = settings.SUPABASE_SERVICE_KEY
STORAGE_API_URL = f"{SUPABASE_URL}/storage/v1"


async def upload_file_to_supabase_async(
    file_content: bytes,
    file_name: str,
    bucket_name: str,
    user_id: str,
    entity_type: str
) -> dict:
    """
    Upload file to Supabase Storage via REST API
    
    Args:
        file_content: File binary content
        file_name: Original file name
        bucket_name: Supabase bucket name ('expense-media' or 'transaction-media')
        user_id: User UUID for organization
        entity_type: Type of entity ('expense' or 'transaction')
        
    Returns:
        Dict with file path and metadata
    """
    try:
        # Generate storage path: user_id/entity_type/year/month/filename
        file_ext = file_name.split('.')[-1].lower() if '.' in file_name else 'bin'
        unique_filename = f"{uuid.uuid4()}.{file_ext}"
        storage_path = f"{user_id}/{entity_type}/{datetime.now().year}/{datetime.now().month}/{unique_filename}"
        
        # Upload to Supabase Storage via REST API
        upload_url = f"{STORAGE_API_URL}/object/{bucket_name}/{storage_path}"
        
        headers = {
            "Authorization": f"Bearer {SERVICE_KEY}",
            "Content-Type": "application/octet-stream"
        }
        
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                upload_url,
                content=file_content,
                headers=headers
            )
            
            if response.status_code not in [200, 201]:
                raise Exception(f"Upload failed: {response.text}")
        
        # Generate public URL
        public_url = f"{SUPABASE_URL}/storage/v1/object/public/{bucket_name}/{storage_path}"
        
        return {
            "file_name": file_name,
            "file_path": storage_path,
            "file_url": public_url,
            "file_size": len(file_content),
            "bucket": bucket_name
        }
    except Exception as e:
        raise Exception(f"Failed to upload file to Supabase: {str(e)}")


def upload_file_to_supabase(
    file_content: bytes,
    file_name: str,
    bucket_name: str,
    user_id: str,
    entity_type: str
) -> dict:
    """
    Synchronous wrapper for upload_file_to_supabase_async
    """
    import asyncio
    
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    return loop.run_until_complete(
        upload_file_to_supabase_async(file_content, file_name, bucket_name, user_id, entity_type)
    )


def delete_file_from_supabase(
    file_path: str,
    bucket_name: str
) -> bool:
    """
    Delete file from Supabase Storage via REST API
    
    Args:
        file_path: Path to file in storage
        bucket_name: Bucket name
        
    Returns:
        True if deleted, False otherwise
    """
    try:
        import httpx
        
        delete_url = f"{STORAGE_API_URL}/object/{bucket_name}/{file_path}"
        
        headers = {
            "Authorization": f"Bearer {SERVICE_KEY}",
        }
        
        response = httpx.delete(
            delete_url,
            headers=headers,
            timeout=10
        )
        
        return response.status_code in [200, 204]
    except Exception as e:
        print(f"Error deleting file from Supabase: {e}")
        return False


def get_file_url(file_path: str, bucket_name: str) -> str:
    """
    Get public URL for a file
    
    Args:
        file_path: Path to file in storage
        bucket_name: Bucket name
        
    Returns:
        Public URL to the file
    """
    try:
        return f"{SUPABASE_URL}/storage/v1/object/public/{bucket_name}/{file_path}"
    except Exception as e:
        raise Exception(f"Failed to get file URL: {str(e)}")
