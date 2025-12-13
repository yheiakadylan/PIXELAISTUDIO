import os
import cv2
import torch
import numpy as np
from PIL import Image
from basicsr.archs.rrdbnet_arch import RRDBNet
from realesrgan import RealESRGANer
from typing import Tuple, Dict
import time


class RealESRGANUpscaler:
    """
    Wrapper for Real-ESRGAN upscaling with support for photo and anime models
    """
    
    def __init__(self, model_type: str = "photo", scale: int = 4):
        """
        Initialize Real-ESRGAN upscaler
        
        Args:
            model_type: 'photo' or 'anime'
            scale: upscale factor (2 or 4)
        """
        self.model_type = model_type
        self.scale = scale
        self.upsampler = None
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        
        print(f"🚀 Initializing Real-ESRGAN ({model_type} model, {scale}x, device: {self.device})")
        self._load_model()
    
    def _load_model(self):
        """Load the appropriate Real-ESRGAN model"""
        try:
            # Model configurations
            if self.model_type == "photo":
                # Real-ESRGAN x4plus for photos
                model_name = 'RealESRGAN_x4plus'
                model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)
                model_url = 'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth'
            else:
                # Real-ESRGAN x4plus anime 6B for anime/illustrations
                model_name = 'RealESRGAN_x4plus_anime_6B'
                model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=6, num_grow_ch=32, scale=4)
                model_url = 'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.2.4/RealESRGAN_x4plus_anime_6B.pth'
            
            # Initialize upsampler
            self.upsampler = RealESRGANer(
                scale=4,  # Always use 4x model, we'll handle 2x by downscaling
                model_path=model_url,
                model=model,
                tile=256,  # Tile size for processing (smaller = less memory, slower)
                tile_pad=10,
                pre_pad=0,
                half=False,  # Use FP32 for better quality
                device=self.device
            )
            
            print(f"✅ Model loaded: {model_name}")
            
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            raise
    
    def upscale(self, image_path: str, output_path: str) -> Dict:
        """
        Upscale an image
        
        Args:
            image_path: Path to input image
            output_path: Path to save output image
            
        Returns:
            Dict with processing results
        """
        start_time = time.time()
        
        try:
            # Read image
            img = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
            if img is None:
                raise ValueError(f"Failed to read image: {image_path}")
            
            original_h, original_w = img.shape[:2]
            print(f"📸 Original size: {original_w}x{original_h}")
            
            # Upscale with Real-ESRGAN (always 4x)
            print("🔄 Upscaling with Real-ESRGAN...")
            output, _ = self.upsampler.enhance(img, outscale=4)
            
            upscaled_h, upscaled_w = output.shape[:2]
            print(f"✨ Upscaled to: {upscaled_w}x{upscaled_h}")
            
            # If user wants 2x, downscale from 4x to 2x
            if self.scale == 2:
                target_w = original_w * 2
                target_h = original_h * 2
                output = cv2.resize(output, (target_w, target_h), interpolation=cv2.INTER_LANCZOS4)
                upscaled_w, upscaled_h = target_w, target_h
                print(f"⬇️ Downscaled to 2x: {upscaled_w}x{upscaled_h}")
            
            # Save output
            cv2.imwrite(output_path, output)
            processing_time = time.time() - start_time
            
            print(f"✅ Upscaling complete in {processing_time:.2f}s")
            
            return {
                "success": True,
                "original_size": (original_w, original_h),
                "upscaled_size": (upscaled_w, upscaled_h),
                "processing_time": processing_time
            }
            
        except Exception as e:
            print(f"❌ Upscaling error: {e}")
            raise
    
    def cleanup(self):
        """Clean up resources"""
        if self.upsampler:
            del self.upsampler
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        print("🧹 Cleanup complete")


# Cache for upscaler instances to avoid reloading models
_upscaler_cache = {}


def get_upscaler(model_type: str, scale: int) -> RealESRGANUpscaler:
    """
    Get or create cached upscaler instance
    
    Args:
        model_type: 'photo' or 'anime'
        scale: upscale factor (2 or 4)
        
    Returns:
        RealESRGANUpscaler instance
    """
    cache_key = f"{model_type}_{scale}"
    
    if cache_key not in _upscaler_cache:
        _upscaler_cache[cache_key] = RealESRGANUpscaler(model_type, scale)
    
    return _upscaler_cache[cache_key]
