# AI Upscaler Backend

Python FastAPI backend với Real-ESRGAN cho chất lượng upscaling tốt nhất.

## Requirements

- Python 3.8+
- pip
- (Optional) NVIDIA GPU + CUDA cho performance tốt hơn

## Installation

### Windows

```bash
# 1. Create virtual environment
cd backend
python -m venv venv
venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run server
python main.py
```

### Linux/Mac

```bash
# 1. Create virtual environment
cd backend
python3 -m venv venv
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run server
python main.py
```

## API Endpoints

### Health Check
```
GET /api/health
```

Response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "gpu_available": true
}
```

### Upscale Image
```
POST /api/upscale
```

Form Data:
- `file`: Image file (max 10MB)
- `model_type`: "photo" or "anime"
- `scale_rate`: 2 or 4

Response:
```json
{
  "success": true,
  "filename": "uuid_output.png",
  "original_size": [800, 600],
  "upscaled_size": [3200, 2400],
  "processing_time": 5.23,
  "message": "Successfully upscaled 4x using photo model"
}
```

### Download Result
```
GET /api/download/{filename}
```

Returns the upscaled image file.

## Configuration

Edit `.env` file:

```env
PORT=8000
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_EXTENSIONS=jpg,jpeg,png,webp
```

## Models

Models auto-download on first use:

- **Photo**: RealESRGAN_x4plus (~67MB)
- **Anime**: RealESRGAN_x4plus_anime_6B (~17MB)

Saved in: `~/.cache/torch/hub/checkpoints/`

## GPU Support

If you have NVIDIA GPU:
1. Install CUDA Toolkit
2. Install PyTorch with CUDA: 
   ```bash
   pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
   ```
3. Verify: `python -c "import torch; print(torch.cuda.is_available())"`

## Troubleshooting

**Error: Failed to load model**
- Check internet connection (models download from GitHub)
- Try running with `--reload` flag removed

**Error: CUDA out of memory**
- Reduce tile size in `upscaler.py`: `tile=128` instead of `tile=256`
- Use CPU mode (slower): Set device to 'cpu'

**Server won't start**
- Check if port 8000 is available
- Try different port: `uvicorn main:app --port 8001`
