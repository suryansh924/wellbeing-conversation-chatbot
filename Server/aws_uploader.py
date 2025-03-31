from fastapi import APIRouter, HTTPException, Depends, Response
from dotenv import load_dotenv
import os
import boto3

# Load AWS credentials from the .env.aws file
load_dotenv(".env")

AWS_ACCESS_KEY = os.getenv("ACCESS_KEY_ID")
AWS_SECRET_KEY = os.getenv("SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("REGION")
BUCKET_NAME = os.getenv("BUCKET_NAME")

def upload_pdf_to_s3(pdf_bytes: bytes, pdf_filename: str) -> str:
    """
    Uploads the PDF bytes directly to AWS S3 without saving to disk.
    Returns the public S3 URL.
    """
    print(AWS_ACCESS_KEY)
    print(AWS_SECRET_KEY)
    print(AWS_REGION)
    print(BUCKET_NAME)

    try:
        s3_client = boto3.client(
            "s3",
            aws_access_key_id=AWS_ACCESS_KEY,
            aws_secret_access_key=AWS_SECRET_KEY,
            region_name=AWS_REGION
        )

        s3_client.put_object(
                Bucket=BUCKET_NAME,
                Key=pdf_filename,
                Body=pdf_bytes,
                # ACL="public-read",
                ContentType="application/pdf"
            )

        # Generate the file URL
        file_url = f"https://{BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{pdf_filename}"
        return file_url
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload PDF to S3: {str(e)}")