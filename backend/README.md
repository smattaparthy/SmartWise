# Backend Setup

## Requirements
- Python 3.11 or 3.12 (Python 3.14 not yet supported by chromadb dependencies)
- Docker (recommended for development)

## Local Development

### Using Docker (Recommended)
```bash
docker-compose up backend
```

### Using Virtual Environment
```bash
# Use Python 3.11 or 3.12
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8200 --reload
```

## API Documentation
- Health check: http://localhost:8200/health
- Interactive API docs: http://localhost:8200/docs
