"""
Supabase Storage Client
Uses the Supabase Python SDK so it works with both the old JWT key format
and the new sb_secret_ key format.
"""

import asyncio
import mimetypes
import uuid
from datetime import datetime

from app.config import settings

SUPABASE_URL = settings.SUPABASE_URL
SERVICE_KEY  = settings.SUPABASE_SERVICE_KEY


def _get_client():
    from supabase import create_client
    return create_client(SUPABASE_URL, SERVICE_KEY)


def _upload_sync(
    file_content: bytes,
    file_name:    str,
    bucket_name:  str,
    user_id:      str,
    entity_type:  str,
) -> dict:
    file_ext      = file_name.rsplit(".", 1)[-1].lower() if "." in file_name else "bin"
    unique_name   = f"{uuid.uuid4()}.{file_ext}"
    now           = datetime.now()
    storage_path  = f"{user_id}/{entity_type}/{now.year}/{now.month}/{unique_name}"

    mime_type, _ = mimetypes.guess_type(file_name)
    if not mime_type:
        mime_type = "application/octet-stream"

    client = _get_client()

    # Upload — SDK handles auth regardless of key format
    client.storage.from_(bucket_name).upload(
        path=storage_path,
        file=file_content,
        file_options={"content-type": mime_type},
    )

    public_url = client.storage.from_(bucket_name).get_public_url(storage_path)

    return {
        "file_name": file_name,
        "file_path": storage_path,
        "file_url":  public_url,
        "file_size": len(file_content),
        "bucket":    bucket_name,
    }


async def upload_file_to_supabase_async(
    file_content: bytes,
    file_name:    str,
    bucket_name:  str,
    user_id:      str,
    entity_type:  str,
) -> dict:
    """Async wrapper — runs the sync SDK call in a thread pool."""
    try:
        return await asyncio.to_thread(
            _upload_sync, file_content, file_name, bucket_name, user_id, entity_type
        )
    except Exception as e:
        raise Exception(f"Failed to upload file to Supabase: {e}")


def delete_file_from_supabase(file_path: str, bucket_name: str) -> bool:
    try:
        client = _get_client()
        client.storage.from_(bucket_name).remove([file_path])
        return True
    except Exception as e:
        print(f"Error deleting file from Supabase: {e}")
        return False


def get_file_url(file_path: str, bucket_name: str) -> str:
    client = _get_client()
    return client.storage.from_(bucket_name).get_public_url(file_path)
