from pydantic import BaseModel
from typing import Literal, Tuple


class UpscaleRequest(BaseModel):
    """Request model for upscale endpoint"""
    model_type: Literal["photo", "anime"]
    scale_rate: Literal[2, 4]


class UpscaleResponse(BaseModel):
    """Response model for upscale endpoint"""
    success: bool
    filename: str
    original_size: Tuple[int, int]
    upscaled_size: Tuple[int, int]
    processing_time: float
    message: str = ""


class HealthResponse(BaseModel):
    """Response model for health check"""
    status: str
    version: str
    gpu_available: bool
