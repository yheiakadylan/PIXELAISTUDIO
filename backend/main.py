from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import os
import uuid
import shutil
from pathlib import Path
from dotenv import load_dotenv
import torch

from models import UpscaleResponse, HealthResponse
from upscaler import get_upscaler

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="AI Upscaler API",
    description="Real-ESRGAN powered image upscaling API",
    version="1.0.0"
)

# CORS configuration for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Local dev
        "http://localhost:3000",  # React dev
        "https://pixelaistudio.vercel.app",  # Production Vercel
        "https://*.vercel.app",  # All Vercel preview deployments
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./uploads"))
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", 10 * 1024 * 1024))  # 10MB
ALLOWED_EXTENSIONS = os.getenv("ALLOWED_EXTENSIONS", "jpg,jpeg,png,webp").split(",")

# Ensure upload directory exists
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Mount uploads directory for serving files
app.mount("/files", StaticFiles(directory=str(UPLOAD_DIR)), name="files")


def validate_image(file: UploadFile) -> None:
    """Validate uploaded image file"""
    # Check file extension
    ext = file.filename.split(".")[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Check file size (approximate check)
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE / 1024 / 1024}MB"
        )


@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        gpu_available=torch.cuda.is_available()
    )


@app.post("/api/upscale", response_model=UpscaleResponse)
async def upscale_image(
    file: UploadFile = File(...),
    model_type: str = Form(...),
    scale_rate: int = Form(...)
):
    """
    Upscale an image using Real-ESRGAN
    
    Args:
        file: Image file to upscale
        model_type: 'photo' or 'anime'
        scale_rate: 2 or 4
        
    Returns:
        UpscaleResponse with result details
    """
    try:
        # Validate inputs
        validate_image(file)
        
        if model_type not in ["photo", "anime"]:
            raise HTTPException(status_code=400, detail="model_type must be 'photo' or 'anime'")
        
        if scale_rate not in [2, 4]:
            raise HTTPException(status_code=400, detail="scale_rate must be 2 or 4")
        
        # Generate unique filenames
        file_id = str(uuid.uuid4())
        ext = file.filename.split(".")[-1].lower()
        input_filename = f"{file_id}_input.{ext}"
        output_filename = f"{file_id}_output.png"
        
        input_path = UPLOAD_DIR / input_filename
        output_path = UPLOAD_DIR / output_filename
        
        # Save uploaded file
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        print(f"📁 Saved input: {input_filename}")
        
        # Get upscaler (cached)
        upscaler = get_upscaler(model_type, scale_rate)
        
        # Upscale image
        result = upscaler.upscale(str(input_path), str(output_path))
        
        # Clean up input file (keep output for download)
        os.remove(input_path)
        
        # Schedule output file cleanup after 1 hour (in production, use background task)
        # For now, files accumulate in uploads/ - user should clean manually
        
        return UpscaleResponse(
            success=True,
            filename=output_filename,
            original_size=result["original_size"],
            upscaled_size=result["upscaled_size"],
            processing_time=result["processing_time"],
            message=f"Successfully upscaled {scale_rate}x using {model_type} model"
        )
        
    except ValueError as e:
        # Clean up files on error
        if input_path.exists():
            os.remove(input_path)
        if output_path.exists():
            os.remove(output_path)
        raise HTTPException(status_code=400, detail=str(e))
    
    except Exception as e:
        # Clean up files on error
        if input_path.exists():
            os.remove(input_path)
        if output_path.exists():
            os.remove(output_path)
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=f"Upscaling failed: {str(e)}")


@app.get("/api/download/{filename}")
async def download_file(filename: str):
    """Download upscaled image"""
    file_path = UPLOAD_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=str(file_path),
        media_type="image/png",
        filename=filename
    )


@app.on_event("startup")
async def startup_event():
    """Run on application startup"""
    print("=" * 50)
    print("🚀 AI Upscaler API Starting...")
    print(f"📁 Upload directory: {UPLOAD_DIR}")
    print(f"🎮 GPU available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"   GPU: {torch.cuda.get_device_name(0)}")
    print("=" * 50)


@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown"""
    print("👋 Shutting down AI Upscaler API...")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
