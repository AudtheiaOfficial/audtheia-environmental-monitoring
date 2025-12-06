# Audtheia Environmental Monitoring System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/AudtheiaOfficial/audtheia-environmental-monitoring/blob/main/LICENSE)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![GitHub Stars](https://img.shields.io/github/stars/AudtheiaOfficial/audtheia-environmental-monitoring?style=flat&logo=github)](https://github.com/AudtheiaOfficial/audtheia-environmental-monitoring/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/AudtheiaOfficial/audtheia-environmental-monitoring?style=flat&logo=github)](https://github.com/AudtheiaOfficial/audtheia-environmental-monitoring/network/members)
[![GitHub Issues](https://img.shields.io/github/issues/AudtheiaOfficial/audtheia-environmental-monitoring)](https://github.com/AudtheiaOfficial/audtheia-environmental-monitoring/issues)
(https://img.shields.io/badge/docs-latest-blue)](https://github.com/AudtheiaOfficial/audtheia-environmental-monitoring/tree/main/docs)
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.17842738.svg)](https://doi.org/10.5281/zenodo.17842738)[![Documentation]

**Real-time Computer Vision + Deep AI Analysis for Research-Grade Ecological Datasets**

Audtheia is a professional environmental monitoring system that combines real-time computer vision (60 FPS video processing) with AI-powered analysis to generate research-grade ecological datasets and automated daily intelligence reports. The system processes stereo-video recordings from marine and terrestrial environments, using specialized AI agents to identify species and analyze environmental conditions while maintaining the speed required for continuous monitoring. Each species observation generates 72 comprehensive data points used for both database storage and automated PDF report generation.

---

## The Problem Audtheia Solves

Traditional environmental monitoring systems face a critical trade-off: **processing speed versus analytical depth**. Real-time systems can track species movements but lack detailed ecological analysis. Deep analysis systems provide rich data but cannot process video in real-time.

**Audtheia solves this through asynchronous architecture**:

- **Roboflow RTSP Workflow**: Processes video at 60 FPS with YOLOv11 object detection, ByteTrack multi-object tracking, and live visualization
- **N8N RTSP Analyst**: Conducts deep AI analysis in parallel using 9 specialized agents, generating 72 data points per species observation
- **Daily Reporter Workflow**: Synthesizes observation data into publication-quality PDF reports using 5 specialized AI agents
- **Airtable Database**: Stores comprehensive datasets suitable for peer-reviewed research and institutional decision-making

**Result**: Continuous real-time monitoring + PhD-level environmental analysis + automated professional reporting without compromising any capability.

---

## System Architecture

The Audtheia ecosystem consists of four integrated components:

### 1. Roboflow RTSP Workflow (Real-time Video Processing)

**Purpose**: 60 FPS video processing with object detection and tracking

**Components**:
- **Object Detection Model**: YOLOv11-based detection (bird-species-kdlph-uavcv/1)
- **ByteTrack**: Multi-object tracking with 60 FPS buffer
- **Custom Python Blocks**:
  - `Detection_Converter`: Converts predictions to structured data
  - `Add_Webcam_Interface`: Professional video overlay with species ticker
  - `Anthropic_Environmental_Analyzer`: 15-second interval comprehensive environmental analysis using **Claude 3.5 Sonnet**
  - `Analyst_Caller`: Sends detections to N8N for deep analysis

**Video Input**: RTSP streams, MP4 files, webcam feeds  
**Output**: Annotated video stream + detection data → N8N RTSP Analyst

### 2. N8N RTSP Analyst Workflow (Deep AI Analysis)

**Purpose**: Comprehensive species and environmental intelligence using 9 specialized AI agents

**AI Agents (powered by OpenAI GPT-4o)**:
1. **Systematics Phenologist**: Taxonomic classification, phenological analysis, temporal behavior patterns
2. **GIS Data Manager**: Coordinate validation, geographic context, spatial analysis
3. **Biodiversity Intelligence**: Conservation status (IUCN), rarity scoring, ecological role assessment
4. **EnviroStatus Manager**: Habitat assessment, ecosystem classification, environmental conditions
5. **Marine Climate Search**: Marine zone analysis, oceanographic data, sea surface temperature
6. **Terrestrial Climate Search**: Biome classification, terrestrial climate metrics, soil analysis
7. **Habitat Assessment**: Habitat type determination, ecosystem health evaluation
8. **Cartography Mapper**: Satellite imagery generation (Mapbox), bathymetric analysis (NOAA), marine enhancements
9. **Memory Manager**: Spatiotemporal context tracking, observation history, pattern recognition

**Scientific Databases & Services Integrated**:
- GBIF (Global Biodiversity Information Facility)
- iNaturalist
- IUCN Red List
- API Ninjas (species characteristics and biodiversity data)
- Open-Meteo (climate data)
- NOAA Co-OPS (marine data)
- Mapbox (satellite imagery)
- OpenStreetMap (geographic data)
- OpenTopoData (elevation data)
- SOILGRIDS (soil data)
- Open Elevation (bathymetry and elevation)
- NDVI (vegetation index)

**Output**: 72 data points per species observation → Airtable Database

### 3. Daily Reporter N8N Workflow (Automated Report Generation)

**Purpose**: Automated generation of professional environmental intelligence reports

**AI Agents (powered by OpenAI GPT-4o)**:
1. **Species & Biodiversity Analyst**: Synthesizes taxonomic data, conservation status, rarity assessments, and biodiversity metrics into comprehensive species intelligence
2. **Environmental & Climate Analyst**: Analyzes marine/terrestrial climate conditions, oceanographic data, atmospheric conditions, and environmental trends
3. **Habitat & Conservation Analyst**: Evaluates habitat quality, ecosystem health, conservation implications, and management recommendations
4. **Cartography & Spatial Analyst**: Interprets satellite imagery, spatial patterns, geographic context, and creates cartographic assessments
5. **Report Synthesis Agent**: Integrates all analyst outputs into cohesive publication-quality PDF report with executive dashboard

**Report Sections**:
- Executive dashboard with key metrics
- Species biodiversity analysis
- Environmental and climate assessment
- Habitat and conservation status
- Cartography and spatial intelligence
- FAIR data compliance checklist

**Output**: Publication-quality PDF reports suitable for institutional audiences (NOAA, MBARI, conservation organizations)

### 4. Airtable Database (Research-Grade Data Storage)

**Purpose**: Structured storage of all observation data for research and analysis

**Database Tables**:
- **Species Observations** (62 columns): Taxonomic data, phenology, behavior, conservation status, biodiversity metrics
- **Environmental Mapping** (10 columns): Coordinates, satellite imagery URLs, marine enhancements, habitat data

**Data Quality**: Research-grade datasets suitable for peer-reviewed publications, conservation planning, and institutional decision-making

---

## Data Flow

```
Video Input (RTSP/MP4/Webcam)
    ↓
[Roboflow RTSP Workflow] ← 60 FPS Processing
    ↓
Object Detection (YOLOv11) → ByteTrack Multi-Object Tracking
    ↓
Detection Data + Video Frame
    ↓
[N8N RTSP Analyst Workflow] ← Deep AI Analysis
    ↓
9 Specialized AI Agents (GPT-4o)
    ↓
72 Data Points per Species Observation
    ↓
[Airtable Database] ← Research-Grade Storage
    ↓
[Daily Reporter N8N Workflow] ← Report Generation
    ↓
5 Specialized Report Agents (GPT-4o)
    ↓
Professional PDF Intelligence Report
```

---

## Installation

### Prerequisites

- **Python**: 3.8 or higher
- **Operating System**: Windows, macOS, or Linux
- **GPU**: CUDA-compatible GPU recommended for real-time processing
- **API Keys**: Anthropic, OpenAI, Roboflow, Airtable, GBIF, Mapbox (see [Configuration](#configuration))

### Quick Start

```bash
# Clone repository
git clone https://github.com/AudtheiaOfficial/audtheia-environmental-monitoring.git
cd audtheia-environmental-monitoring

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install required packages
pip install -r requirements.txt
```

### N8N Workflow Setup

1. Install [N8N](https://n8n.io/) locally or use N8N Cloud
2. Import workflow files from `n8n-workflows/` directory:
   - `rtsp-analyst/RTSP_Analyst_Workflow__GitHub_Template_.json`
   - `daily-reporter/Daily_Reporter__GitHub_Template_.json`
3. Configure N8N credentials for Anthropic, OpenAI, Airtable, and external APIs

### Roboflow Configuration

1. Upload `roboflow/workflows/Roboflow_Anthropic_Integration_Workflow__GitHub_Template_.py` to your Roboflow workspace
2. Configure custom Python blocks with your API credentials
3. Set RTSP stream URL or video file path

For detailed installation instructions, see [`docs/installation.md`](docs/installation.md).

---

## Configuration

Create a `.env` file based on `.env.template` and add the following credentials:

```bash
# Anthropic Claude API (for Roboflow workflow)
ANTHROPIC_API_KEY=sk-ant-api03-...

# OpenAI API (for N8N workflows)
OPENAI_API_KEY=sk-...

# Roboflow
ROBOFLOW_API_KEY=your_roboflow_key
ROBOFLOW_WORKSPACE=your_workspace_name
ROBOFLOW_PROJECT=your_project_name
ROBOFLOW_MODEL_VERSION=1

# N8N
N8N_WEBHOOK_BASE_URL=https://your-n8n-instance.app.n8n.cloud
N8N_ROBOFLOW_DETECTION_WEBHOOK=/webhook/roboflow-detection
N8N_RTSP_ANALYST_WEBHOOK=/webhook/rtsp-analyst
N8N_DAILY_REPORTER_WEBHOOK=/webhook/daily-reporter

# Airtable
AIRTABLE_API_KEY=patXXXXXXXXXXXXXX
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
AIRTABLE_SPECIES_TABLE_ID=tblXXXXXXXXXXXXXX
AIRTABLE_MAPPING_TABLE_ID=tblXXXXXXXXXXXXXX

# Scientific Databases
GBIF_USERNAME=your_gbif_username
GBIF_PASSWORD=your_gbif_password
IUCN_API_KEY=your_iucn_key
API_NINJAS_KEY=your_api_ninjas_key

# Mapping Services
MAPBOX_ACCESS_TOKEN=pk.eyJ1...
OPEN_METEO_API_KEY=your_openmeteo_key  # if required

# Video Processing
RTSP_CAMERA_URL=rtsp://your-camera-url
VIDEO_FPS=60
VIDEO_RESOLUTION_WIDTH=1920
VIDEO_RESOLUTION_HEIGHT=1080
```

### API Key Acquisition

- **Anthropic Claude**: [Sign up at Anthropic](https://www.anthropic.com/)
- **OpenAI**: [Sign up at OpenAI](https://openai.com/)
- **Roboflow**: [Create account at Roboflow](https://roboflow.com/)
- **N8N**: [Install N8N](https://n8n.io/) or use N8N Cloud
- **Airtable**: [Create account at Airtable](https://airtable.com/)
- **GBIF**: [Register at GBIF](https://www.gbif.org/)
- **API Ninjas**: [Sign up at API Ninjas](https://api-ninjas.com/)
- **Mapbox**: [Sign up at Mapbox](https://www.mapbox.com/)

---

## Usage

### Running the Roboflow RTSP Workflow

```bash
# Activate virtual environment
source venv/bin/activate  # macOS/Linux
# or
venv\Scripts\activate  # Windows

# Run Roboflow RTSP Workflow
python roboflow/workflows/Deploy_Roboflow_Anthropic_Pipeline.py
```

The system will:
- Connect to RTSP stream or video file
- Process video at 60 FPS with object detection
- Track species with ByteTrack
- Send detection data to N8N RTSP Analyst every 15 seconds
- Display annotated video with species ticker

### Running N8N Workflows

The N8N RTSP Analyst workflow automatically processes detection data sent from Roboflow. Each species observation generates:
- Taxonomic classification and phenology
- Geographic and spatial context
- Biodiversity and conservation metrics
- Environmental and climate conditions
- Satellite imagery and cartographic analysis

Results are stored in Airtable Database with 72 data points per observation.

### Generating Daily Reports

The Daily Reporter N8N Workflow can be triggered:

**Manual trigger**:
```bash
# Using N8N CLI or API
curl -X POST https://your-n8n-instance.app.n8n.cloud/webhook/daily-reporter
```

**Scheduled trigger**: Configure N8N cron schedule for automated daily report generation

**Output**: Professional PDF report with comprehensive environmental intelligence synthesized by 5 specialized AI agents

---

## Data Structure

### Species Observations Table (62 Columns)

**Taxonomic Data**:
- Species Name, Common Name, Scientific Classification
- Kingdom, Phylum, Class, Order, Family, Genus, Species
- GBIF Usage Key

**Phenological Data**:
- Observation Time, Season, Life Stage
- Breeding Season Match, Migration Route Overlap
- Temporal Activity Patterns

**Biodiversity Metrics**:
- GBIF Occurrence Count
- IUCN Conservation Status
- Species Rarity Score (0.0-1.0)
- Species Rarity Reason
- Endemic Species (Boolean)
- Ecological Role

**Geographic Data**:
- Coordinates (Latitude, Longitude)
- Location, Region, Country
- Geographic Zone, Habitat Type
- Elevation

**Environmental Conditions**:
- Marine Zone, Terrestrial Biome
- Air Temperature, Soil Temperature
- Precipitation, Humidity
- Atmospheric Pressure
- Ocean Current, Wave Height
- Substrate Type, Land Cover Type

### Environmental Mapping Table (10 Columns)

- Observation ID (links to Species Observations)
- Satellite Imagery URLs (3 zoom levels)
- Marine Enhancement Data (NOAA stations, bathymetry)
- Cartographic Analysis
- Timestamp

For complete schema details, see:
- [`airtable-schemas/species-observations-schema.json`](airtable-schemas/species-observations-schema.json)
- [`airtable-schemas/environmental-mapping-schema.json`](airtable-schemas/environmental-mapping-schema.json)

---

## Use Cases

### Marine Ecosystems
- **Coral reef monitoring**: Real-time species detection with comprehensive habitat assessment
- **Sea turtle tracking**: Migration pattern analysis with oceanographic data integration
- **Fish population surveys**: Automated counting with biodiversity intelligence

### Terrestrial Ecosystems
- **Wildlife surveys**: Continuous monitoring with automated species identification
- **Bird migration studies**: Temporal tracking with phenological analysis
- **Endangered species monitoring**: Conservation status tracking with IUCN integration

### Target Institutions
- **NOAA**: Marine ecosystem monitoring and climate impact assessment
- **MBARI**: Deep-sea research with automated species cataloging
- **The Nature Conservancy**: Conservation planning with research-grade datasets
- **Academic Research**: Publication-quality data for peer-reviewed studies

---

## System Requirements

### Minimum
- CPU: Intel Core i5 or equivalent
- RAM: 16 GB
- Storage: 50 GB available space
- GPU: NVIDIA GTX 1060 or equivalent (for real-time processing)
- Network: Stable internet connection for API calls

### Recommended
- CPU: Intel Core i7 or AMD Ryzen 7
- RAM: 32 GB
- Storage: 100 GB SSD
- GPU: NVIDIA RTX 3060 or higher
- Network: High-speed internet (50+ Mbps)

---

## Current Status

- ✅ Roboflow RTSP Workflow (operational)
- ✅ N8N RTSP Analyst (9 AI agents operational)
- ✅ Daily Reporter Workflow (5 AI agents operational)
- ✅ Airtable Database integration (operational)

### In Development
- Multi-camera synchronization
- Edge deployment for remote locations
- Mobile application for field researchers
- Integration with additional scientific databases
- Real-time alert system for rare species detection

---

## Contributing

We welcome contributions from the research community! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:
- Bug reports and feature requests
- Code contributions
- Dataset contributions
- Scientific validation
- Documentation improvements

---

## Citation

If you use Audtheia in your research, please cite:

```bibtex
@software{audtheia2025,
  author = {Portalatin, Andy},
  title = {Audtheia: AI-Powered Environmental Monitoring System},
  year = {2025},
  version = {1.0.0},
  doi = {10.5281/zenodo.17842738},
  url = {https://github.com/AudtheiaOfficial/audtheia-environmental-monitoring}
}
```

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

Audtheia is built on the shoulders of giants:

**AI & ML**:
- **Anthropic**: Claude 3.5 Sonnet for Roboflow workflow environmental analysis
- **OpenAI**: GPT-4o for N8N workflow AI agent orchestration
- **Roboflow**: Computer vision infrastructure and YOLOv11 integration

**Infrastructure**:
- **N8N**: Workflow automation and AI agent orchestration
- **Airtable**: Database management and data organization

**Scientific Data**:
- **GBIF**: Global biodiversity occurrence data
- **iNaturalist**: Community science observations
- **IUCN**: Conservation status data
- **API Ninjas**: Species characteristics and biodiversity data

**Geospatial Services**:
- **NOAA**: Marine and climate data
- **Mapbox**: Satellite imagery and cartographic services
- **Open-Meteo**: Climate and weather data
- **OpenStreetMap**: Geographic data
- **OpenTopoData**: Elevation data
- **SOILGRIDS**: Soil data
- **Open Elevation**: Bathymetry and elevation data

Special thanks to the marine biology, conservation, and research communities for their invaluable feedback and support.

---

## Contact

**Project Lead**: Andy Portalatin  
**GitHub Issues**: [https://github.com/AudtheiaOfficial/audtheia-environmental-monitoring/issues](https://github.com/AudtheiaOfficial/audtheia-environmental-monitoring/issues)

---

## Disclaimer

Audtheia is designed for research and conservation purposes. While the system generates research-grade data, all results should be validated by qualified researchers before use in critical decision-making. Species identifications and environmental assessments are AI-generated and may require expert verification.

---

**Built with ❤️ for the global research and conservation community**
