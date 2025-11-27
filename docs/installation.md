# Audtheia Installation Guide

Complete step-by-step installation instructions for the Audtheia Environmental Monitoring System.

## Table of Contents

- [System Requirements](#system-requirements)
- [Prerequisites Installation](#prerequisites-installation)
- [Audtheia Installation](#audtheia-installation)
- [API Credentials Configuration](#api-credentials-configuration)
- [N8N Workflow Setup](#n8n-workflow-setup)
- [Roboflow Workflow Configuration](#roboflow-workflow-configuration)
- [Airtable Database Setup](#airtable-database-setup)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

## System Requirements

### Minimum Requirements
- **CPU**: Intel Core i5 or equivalent
- **RAM**: 16 GB
- **Storage**: 50 GB available space
- **GPU**: NVIDIA GTX 1060 or equivalent (for real-time processing)
- **OS**: Windows 10/11, macOS 11+, or Ubuntu 20.04+
- **Network**: Stable internet connection (10+ Mbps)

### Recommended Requirements
- **CPU**: Intel Core i7 or AMD Ryzen 7
- **RAM**: 32 GB
- **Storage**: 100 GB SSD
- **GPU**: NVIDIA RTX 3060 or higher with CUDA support
- **Network**: High-speed internet (50+ Mbps)

## Prerequisites Installation

### 1. Python 3.8+

**Windows:**
```powershell
# Download from https://www.python.org/downloads/
# Ensure "Add Python to PATH" is checked during installation

# Verify installation
python --version
```

**macOS:**
```bash
# Using Homebrew
brew install python@3.11

# Verify installation
python3 --version
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install python3.11 python3.11-venv python3-pip

# Verify installation
python3 --version
```

### 2. Git

**Windows:**
Download from https://git-scm.com/download/win

**macOS:**
```bash
brew install git
```

**Linux:**
```bash
sudo apt install git
```

### 3. CUDA Toolkit (for GPU acceleration)

Download CUDA Toolkit 11.8+ from NVIDIA: https://developer.nvidia.com/cuda-downloads

Verify installation:
```bash
nvcc --version
```

### 4. N8N Workflow Automation

**Option A: N8N Cloud (Recommended for beginners)**
1. Visit https://n8n.io/cloud
2. Create account and workspace
3. Note your workspace URL (e.g., `https://your-workspace.app.n8n.cloud`)

**Option B: Self-Hosted N8N**
```bash
# Using npm
npm install -g n8n

# Start N8N
n8n start

# Access at http://localhost:5678
```

**Option C: Docker**
```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

## Audtheia Installation

### 1. Clone Repository
```bash
git clone https://github.com/AudtheiaOfficial/audtheia-environmental-monitoring.git
cd audtheia-environmental-monitoring
```

### 2. Create Virtual Environment

**Windows:**
```powershell
python -m venv venv
venv\Scripts\activate
```

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

You should see `(venv)` in your terminal prompt.

### 3. Install Python Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**Expected packages:**
- `roboflow>=1.1.0` - Computer vision infrastructure
- `anthropic>=0.18.0` - Claude API client
- `opencv-python>=4.8.0` - Video processing
- `numpy>=1.24.0` - Numerical computing
- `python-dotenv>=1.0.0` - Environment variable management
- `requests>=2.31.0` - HTTP requests
- `Pillow>=10.0.0` - Image processing

### 4. Verify Installation
```bash
python -c "import roboflow; import anthropic; import cv2; print('All packages installed successfully!')"
```

## API Credentials Configuration

### 1. Create Environment File
```bash
# Copy template
cp .env.template .env

# Edit .env file with your preferred text editor
```

### 2. Required API Keys

#### Anthropic Claude API
- **Purpose**: Environmental analysis in Roboflow workflow
- **Sign up**: https://console.anthropic.com/
- **Get API key**: Console → API Keys → Create Key
- **Add to .env**: `ANTHROPIC_API_KEY=sk-ant-api03-...`

#### OpenAI API
- **Purpose**: AI agents in N8N workflows
- **Sign up**: https://platform.openai.com/signup
- **Get API key**: https://platform.openai.com/api-keys
- **Add to .env**: `OPENAI_API_KEY=sk-proj-...`

#### Roboflow
- **Purpose**: Computer vision platform
- **Sign up**: https://app.roboflow.com/login
- **Create workspace**: https://app.roboflow.com/
- **Get API key**: Settings → Roboflow API → Private API Key
- **Add to .env**:
```
  ROBOFLOW_API_KEY=your_roboflow_key
  ROBOFLOW_WORKSPACE=your-workspace-name
  ROBOFLOW_PROJECT=your-project-name
  ROBOFLOW_MODEL_VERSION=1
```

#### Airtable
- **Purpose**: Database storage
- **Sign up**: https://airtable.com/signup
- **Create base**: https://airtable.com/create
- **Get credentials**: Account → Developer Hub → Personal Access Tokens
- **Create tables**: See [Airtable Database Setup](#airtable-database-setup)
- **Add to .env**:
```
  AIRTABLE_API_KEY=patXXXXXXXXXXXXXX
  AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
  AIRTABLE_SPECIES_TABLE_ID=tblXXXXXXXXXXXXXX
  AIRTABLE_MAPPING_TABLE_ID=tblXXXXXXXXXXXXXX
```

#### GBIF (Global Biodiversity Information Facility)
- **Purpose**: Biodiversity occurrence data
- **Sign up**: https://www.gbif.org/user/profile
- **Add to .env**:
```
  GBIF_USERNAME=your_gbif_username
  GBIF_PASSWORD=your_gbif_password
```

#### API Ninjas
- **Purpose**: Species characteristics
- **Sign up**: https://api-ninjas.com/register
- **Get API key**: https://api-ninjas.com/api
- **Add to .env**: `API_NINJAS_KEY=your_api_ninjas_key`

#### Mapbox
- **Purpose**: Satellite imagery
- **Sign up**: https://account.mapbox.com/auth/signup/
- **Get access token**: https://account.mapbox.com/access-tokens/
- **Add to .env**: `MAPBOX_ACCESS_TOKEN=pk.eyJ1...`

#### IUCN Red List (Optional but recommended)
- **Purpose**: Conservation status data
- **Request token**: https://apiv3.iucnredlist.org/api/v3/token
- **Add to .env**: `IUCN_API_KEY=your_iucn_key`

### 3. Video Source Configuration

**RTSP Camera Stream:**
```
RTSP_CAMERA_URL=rtsp://username:password@camera-ip:554/stream
VIDEO_FPS=60
VIDEO_RESOLUTION_WIDTH=1920
VIDEO_RESOLUTION_HEIGHT=1080
```

**MP4 File:**
```
VIDEO_FILE_PATH=/path/to/your/video.mp4
VIDEO_FPS=60
```

**Webcam:**
```
WEBCAM_INDEX=0
VIDEO_FPS=30
```

## N8N Workflow Setup

### 1. Access N8N Instance

- **Cloud**: Navigate to your N8N workspace URL
- **Self-hosted**: Visit http://localhost:5678

### 2. Configure Credentials

Before importing workflows, configure these credentials in N8N:

**Settings → Credentials → Add Credential**

1. **OpenAI**: Add OpenAI API key
2. **Anthropic**: Add Claude API key
3. **Airtable**: Add Personal Access Token
4. **HTTP Request**: For GBIF, IUCN, API Ninjas, Mapbox

### 3. Import RTSP Analyst Workflow

1. **Navigate**: Workflows → Import
2. **Upload**: `n8n-workflows/rtsp-analyst/RTSP_Analyst_Workflow__GitHub_Template_.json`
3. **Configure Webhooks**:
   - Click "Webhook" node
   - Copy webhook URL
   - Add to `.env` as `N8N_RTSP_ANALYST_WEBHOOK=/webhook-path`
4. **Update Credentials**: Select your configured credentials in each node
5. **Replace Placeholders**:
   - Find all `{{$env.VARIABLE_NAME}}` placeholders
   - Verify they match your `.env` file
6. **Activate Workflow**: Toggle switch to "Active"

### 4. Import Daily Reporter Workflow

1. **Navigate**: Workflows → Import
2. **Upload**: `n8n-workflows/daily-reporter/Daily_Reporter__GitHub_Template_.json`
3. **Configure Webhooks** (same as above)
4. **Update Credentials**: OpenAI, Airtable, API Template
5. **Activate Workflow**

### 5. Test Webhooks
```bash
# Test RTSP Analyst
curl -X POST https://your-n8n-instance.app.n8n.cloud/webhook/rtsp-analyst \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Test Daily Reporter
curl -X POST https://your-n8n-instance.app.n8n.cloud/webhook/daily-reporter \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## Roboflow Workflow Configuration

### 1. Access Roboflow Workspace

1. Log in to https://app.roboflow.com
2. Navigate to your workspace
3. Go to Workflows section

### 2. Upload Workflow Template

1. **Create New Workflow**
2. **Import from File**: `roboflow/workflows/Roboflow_Anthropic_Integration_Workflow__GitHub_Template_.py`
3. **Configure Custom Python Blocks**:
   
   **Detection_Converter Block:**
   - Converts YOLO predictions to structured format
   - No configuration required
   
   **Add_Webcam_Interface Block:**
   - Adds video overlay with species ticker
   - Configure display preferences
   
   **Anthropic_Environmental_Analyzer Block:**
   - Set `ANTHROPIC_API_KEY` environment variable
   - Configure analysis interval (default: 15 seconds)
   
   **Analyst_Caller Block:**
   - Set `N8N_WEBHOOK_URL` to your N8N RTSP Analyst webhook
   - Sends detection data to N8N for deep analysis

### 3. Set Video Source

In Roboflow Workflow:
- **RTSP Stream**: Configure stream URL
- **Video File**: Upload or specify file path
- **Webcam**: Select webcam device

### 4. Deploy Workflow

**Option A: Deploy via Roboflow Platform**
```bash
# From Roboflow Workflows UI:
# 1. Save workflow
# 2. Click "Deploy"
# 3. Select deployment target (cloud/edge device)
```

**Option B: Deploy Locally**
```bash
# Activate virtual environment
source venv/bin/activate  # macOS/Linux
# or
venv\Scripts\activate     # Windows

# Run deployment script
python roboflow/workflows/Deploy_Roboflow_Anthropic_Pipeline.py
```

## Airtable Database Setup

### 1. Create Airtable Base

1. Log in to https://airtable.com
2. Click "Create a base"
3. Name: "Audtheia Environmental Monitoring"
4. Note the Base ID from URL: `https://airtable.com/appXXXXXXXXXXXXXX`

### 2. Create Species Observations Table

**Table Name**: `Species Observations`

**Import Schema**: Use schema from `airtable-schemas/species-observations-schema.json`

**Or create manually with 62 columns**:

**Taxonomic Data** (12 columns):
- Observation ID (Single line text, Primary)
- Species Name (Single line text)
- Common Name (Single line text)
- Scientific Name (Single line text)
- Kingdom (Single line text)
- Phylum (Single line text)
- Class (Single line text)
- Order (Single line text)
- Family (Single line text)
- Genus (Single line text)
- Species (Single line text)
- GBIF Usage Key (Number)

**Phenological Data** (9 columns):
- Observation Time (Date & time)
- Season (Single select: Spring, Summer, Fall, Winter)
- Life Stage (Single line text)
- Breeding Season Match (Checkbox)
- Migration Route Overlap (Checkbox)
- Temporal Activity Pattern (Long text)
- Age Class (Single line text)
- Reproductive Status (Single line text)
- Behavior Notes (Long text)

**Biodiversity Metrics** (8 columns):
- GBIF Occurrence Count (Number)
- IUCN Conservation Status (Single select: LC, NT, VU, EN, CR, EW, EX)
- Species Rarity Score (Number, 0.0-1.0)
- Species Rarity Reason (Long text)
- Endemic Species (Checkbox)
- Ecological Role (Single line text)
- Trophic Level (Single line text)
- Functional Group (Single line text)

**Geographic Data** (10 columns):
- Latitude (Number, decimal)
- Longitude (Number, decimal)
- Location (Single line text)
- Region (Single line text)
- Country (Single line text)
- Geographic Zone (Single line text)
- Habitat Type (Single line text)
- Elevation (Number, meters)
- Depth (Number, meters, for marine)
- Biogeographic Region (Single line text)

**Environmental Conditions** (15 columns):
- Marine Zone (Single line text)
- Terrestrial Biome (Single line text)
- Air Temperature (Number, °C)
- Soil Temperature (Number, °C)
- Water Temperature (Number, °C)
- Precipitation (Number, mm)
- Humidity (Number, %)
- Atmospheric Pressure (Number, hPa)
- Ocean Current (Single line text)
- Wave Height (Number, meters)
- Substrate Type (Single line text)
- Land Cover Type (Single line text)
- Vegetation Density (Number, %)
- Water Quality Index (Number)
- Pollution Level (Single select: Low, Moderate, High)

**Metadata** (8 columns):
- Detection Confidence (Number, 0.0-1.0)
- Image URL (URL)
- Video Timestamp (Number, seconds)
- Data Source (Single select: RTSP, Video File, Webcam)
- Quality Score (Number, 0-100)
- Verified (Checkbox)
- Verified By (Single line text)
- Notes (Long text)

### 3. Create Environmental Mapping Table

**Table Name**: `Environmental Mapping`

**Import Schema**: Use schema from `airtable-schemas/environmental-mapping-schema.json`

**Or create manually with 10 columns**:

- Observation ID (Single line text, Primary, Links to Species Observations)
- Satellite Imagery Zoom 10 (URL)
- Satellite Imagery Zoom 12 (URL)
- Satellite Imagery Zoom 14 (URL)
- Marine Enhancement Data (Long text, JSON)
- NOAA Station Data (Long text, JSON)
- Bathymetry Data (Long text, JSON)
- Cartographic Analysis (Long text)
- Spatial Context (Long text)
- Timestamp (Date & time)

### 4. Get Table IDs

1. Open table in Airtable
2. Table ID is in URL: `https://airtable.com/appXXX/tblYYYYYYYYYYYYYY`
3. Add to `.env`:
```
   AIRTABLE_SPECIES_TABLE_ID=tblYYYYYYYYYYYYYY
   AIRTABLE_MAPPING_TABLE_ID=tblZZZZZZZZZZZZZZ
```

### 5. Configure Airtable API Access

1. **Account** → **Developer Hub** → **Personal Access Tokens**
2. **Create Token**
3. **Scopes**: Select `data.records:read` and `data.records:write`
4. **Bases**: Select "Audtheia Environmental Monitoring"
5. **Copy token** and add to `.env` as `AIRTABLE_API_KEY`

## Verification

### 1. Test Python Environment
```bash
# Activate virtual environment
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Test imports
python << EOF
import roboflow
import anthropic
import cv2
import os
from dotenv import load_dotenv

load_dotenv()
print("✓ All packages loaded successfully")

# Test API keys
assert os.getenv('ANTHROPIC_API_KEY'), "Missing ANTHROPIC_API_KEY"
assert os.getenv('ROBOFLOW_API_KEY'), "Missing ROBOFLOW_API_KEY"
assert os.getenv('AIRTABLE_API_KEY'), "Missing AIRTABLE_API_KEY"
print("✓ All required API keys found")

EOF
```

### 2. Test Roboflow Connection
```python
from roboflow import Roboflow
import os
from dotenv import load_dotenv

load_dotenv()

rf = Roboflow(api_key=os.getenv('ROBOFLOW_API_KEY'))
workspace = rf.workspace(os.getenv('ROBOFLOW_WORKSPACE'))
print(f"✓ Connected to Roboflow workspace: {workspace.name}")
```

### 3. Test Anthropic API
```python
from anthropic import Anthropic
import os
from dotenv import load_dotenv

load_dotenv()

client = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
message = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=100,
    messages=[{"role": "user", "content": "Hello!"}]
)
print("✓ Anthropic API connection successful")
```

### 4. Test N8N Webhooks
```bash
# Test RTSP Analyst webhook
curl -X POST $N8N_WEBHOOK_BASE_URL$N8N_RTSP_ANALYST_WEBHOOK \
  -H "Content-Type: application/json" \
  -d '{"test": "connection"}'

# Expected: HTTP 200 response
```

### 5. Test Complete Pipeline
```bash
# Run Roboflow workflow with test video
python roboflow/workflows/Deploy_Roboflow_Anthropic_Pipeline.py

# Monitor:
# 1. Video processing starts
# 2. Detections appear in video feed
# 3. Data sent to N8N (check N8N logs)
# 4. Records appear in Airtable
```

## Troubleshooting

### Common Issues

#### Issue: `ModuleNotFoundError: No module named 'roboflow'`
**Solution**: Ensure virtual environment is activated
```bash
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows
pip install -r requirements.txt
```

#### Issue: `anthropic.AuthenticationError`
**Solution**: Verify Anthropic API key
```bash
# Check .env file
cat .env | grep ANTHROPIC_API_KEY

# Test API key at https://console.anthropic.com/
```

#### Issue: CUDA not available for GPU acceleration
**Solution**: Install CUDA toolkit
```bash
# Check CUDA availability
python -c "import torch; print(torch.cuda.is_available())"

# If False, install CUDA from:
# https://developer.nvidia.com/cuda-downloads
```

#### Issue: N8N workflow not triggering
**Solution**: 
1. Verify webhook URLs in `.env`
2. Check N8N workflow is activated
3. Test webhook with curl
4. Check N8N logs for errors

#### Issue: Airtable API permission denied
**Solution**: 
1. Verify Personal Access Token has correct scopes
2. Check base access permissions
3. Ensure table IDs are correct

#### Issue: Video stream not loading
**Solution**:
```bash
# Test RTSP stream independently
ffplay rtsp://your-camera-url

# For webcam, test with OpenCV:
python -c "import cv2; cap = cv2.VideoCapture(0); print(cap.isOpened())"
```

#### Issue: Low detection accuracy
**Solution**:
1. Ensure model version matches your use case
2. Adjust confidence thresholds in Roboflow workflow
3. Retrain model with domain-specific data
4. Verify video quality (resolution, lighting, focus)

### Getting Help

1. **GitHub Issues**: https://github.com/AudtheiaOfficial/audtheia-environmental-monitoring/issues
2. **Check logs**:
   - Roboflow: Check workflow execution logs
   - N8N: Workflow → Executions
   - Python: Check terminal output
3. **Enable debug mode**:
```bash
   export DEBUG=true
   python roboflow/workflows/Deploy_Roboflow_Anthropic_Pipeline.py
```

### System Requirements Not Met

If your system doesn't meet requirements:
- **Low RAM**: Reduce video resolution, lower FPS
- **No GPU**: Use CPU mode (slower but functional)
- **Slow internet**: Cache API responses, reduce API calls
- **Limited storage**: Configure periodic data cleanup

## Next Steps

After successful installation:

1. **Configure monitoring area**: Set up cameras/video sources
2. **Customize AI agents**: Adjust N8N workflows for your specific needs
3. **Train custom models**: Use Roboflow to train species-specific models
4. **Set up automated reporting**: Configure Daily Reporter schedule
5. **Integrate with research workflow**: Export data to analysis tools

Congratulations! Audtheia is now installed and ready for environmental monitoring. 🎉