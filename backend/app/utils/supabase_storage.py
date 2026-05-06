"""
Supabase Storage Client
Handles file uploads and storage for the backend
"""

import os
from typing import Optional
from supabase import create_client, Client
from app.config import settings

# Initialize Supabase client
supabase: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_KEY
)


def get_supabase_client() -> Client:
    """Get Supabase client instance"""
    return supabase


def upload_file_to_supabase(
    file_content: bytes,
    file_name: str,
    bucket_name: str,
    user_id: str,
    entity_type: str
) -> dict:
    """
    Upload file to Supabase Storage
    
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
        # Generate storage path: user_id/entity_type/filename
        from datetime import datetime
        import uuid
        
        file_ext = file_name.split('.')[-1].lower() if '.' in file_name else 'bin'
        unique_filename = f"{uuid.uuid4()}.{file_ext}"
        storage_path = f"{user_id}/{entity_type}/{datetime.now().year}/{datetime.now().month}/{unique_filename}"
        
        # Upload to Supabase Storage
        response = supabase.storage.from_(bucket_name).upload(
            path=storage_path,
            file=file_content,
            file_options={"content-type": "application/octet-stream"}
        )
        
        # Get public URL
        public_url = supabase.storage.from_(bucket_name).get_public_url(storage_path)
        
        return {
            "file_name": file_name,
            "file_path": storage_path,
            "file_url": public_url,
            "file_size": len(file_content),
            "bucket": bucket_name
        }
    except Exception as e:
        raise Exception(f"Failed to upload file to Supabase: {str(e)}")


def delete_file_from_supabase(
    file_path: str,
    bucket_name: str
) -> bool:
    """
    Delete file from Supabase Storage
    
    Args:
        file_path: Path to file in storage
        bucket_name: Bucket name
        
    Returns:
        True if deleted, False otherwise
    """
    try:
        supabase.storage.from_(bucket_name).remove([file_path])
        return True
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
        return supabase.storage.from_(bucket_name).get_public_url(file_path)
    except Exception as e:
        raise Exception(f"Failed to get file URL: {str(e)}")
