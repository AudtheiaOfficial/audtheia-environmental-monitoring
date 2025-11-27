# Audtheia System Architecture

Comprehensive technical architecture documentation for the Audtheia Environmental Monitoring System.

## Table of Contents

- [System Overview](#system-overview)
- [Architecture Principles](#architecture-principles)
- [Component Architecture](#component-architecture)
- [Data Flow Architecture](#data-flow-architecture)
- [AI Agent Architecture](#ai-agent-architecture)
- [Database Schema Architecture](#database-schema-architecture)
- [API Integration Architecture](#api-integration-architecture)
- [Deployment Architecture](#deployment-architecture)

## System Overview

Audtheia employs an **asynchronous, event-driven architecture** that separates real-time video processing from deep AI analysis. This design pattern enables simultaneous high-speed detection (60 FPS) and comprehensive environmental analysis without performance degradation.

### Core Design Pattern
```
Real-Time Layer (Roboflow)  →  Analysis Layer (N8N)  →  Storage Layer (Airtable)  →  Report Layer (N8N)
       60 FPS                    72 data points           Research-grade DB        Publication PDFs
```

### Architectural Innovation

Traditional monitoring systems face a fundamental trade-off between processing speed and analytical depth. Audtheia resolves this through:

1. **Asynchronous Processing**: Video processing and AI analysis operate independently
2. **Event-Driven Communication**: Webhooks trigger analysis workflows without blocking real-time operations
3. **Specialized Agent Mesh**: 14 AI agents distribute computational load across domains
4. **FAIR Data Principles**: Findable, Accessible, Interoperable, Reusable data storage

## Architecture Principles

### 1. Separation of Concerns

Each component has a single, well-defined responsibility:
- **Roboflow**: Computer vision and object detection
- **N8N**: AI orchestration and workflow automation
- **Airtable**: Structured data storage
- **External APIs**: Domain-specific scientific data

### 2. Scalability

- **Horizontal scaling**: Add more N8N workers for parallel analysis
- **Vertical scaling**: GPU acceleration for video processing
- **Cloud-native**: Deploy components independently

### 3. Modularity

- **Plug-and-play AI agents**: Add/remove agents without system redesign
- **API abstraction**: Switch data providers without workflow changes
- **Model agnostic**: Use any YOLO model or detection framework

### 4. Reliability

- **Fault tolerance**: Component failures don't crash entire system
- **Retry mechanisms**: API failures trigger automatic retries
- **Data validation**: Schema enforcement at every layer

## Component Architecture

### Component 1: Roboflow RTSP Workflow

**Purpose**: Real-time video processing with object detection and tracking

**Technology Stack**:
- **Detection Model**: YOLOv11 (bird-species-kdlph-uavcv/1)
- **Tracking**: ByteTrack (60 FPS object tracking)
- **Video Processing**: OpenCV with GPU acceleration
- **AI Analysis**: Anthropic Claude 3.5 Sonnet

**Custom Python Blocks**:
```python
# Block 1: Detection_Converter
Purpose: Convert YOLOv11 predictions to structured JSON
Input: Raw YOLO detections
Output: {
  "species": str,
  "confidence": float,
  "bbox": [x1, y1, x2, y2],
  "timestamp": ISO 8601,
  "track_id": int
}

# Block 2: Add_Webcam_Interface
Purpose: Video overlay with real-time species ticker
Input: Video frame + detections
Output: Annotated frame with:
  - Bounding boxes
  - Species labels
  - Confidence scores
  - Track IDs
  - Species ticker (running count)

# Block 3: Anthropic_Environmental_Analyzer
Purpose: 15-second interval comprehensive environmental analysis
Input: Detection summary + video context
Claude Prompt: Analyze species behavior, environmental conditions,
               temporal patterns, and ecological significance
Output: Structured environmental assessment

# Block 4: Analyst_Caller
Purpose: Send detection data to N8N for deep analysis
Input: Detection batch (15-second window)
Output: HTTP POST to N8N webhook
Payload: {
  "detections": [...],
  "timestamp": ISO 8601,
  "location": {"lat": float, "lon": float},
  "video_metadata": {...}
}
```

**Video Processing Pipeline**:
```
Video Source (RTSP/MP4/Webcam)
    ↓
Frame Extraction (60 FPS)
    ↓
GPU Preprocessing (resize, normalize)
    ↓
YOLOv11 Inference (batch processing)
    ↓
ByteTrack Association (track continuity)
    ↓
Detection_Converter (structured output)
    ↓
Add_Webcam_Interface (visualization)
    ↓
Every 15 seconds:
    ↓
Anthropic_Environmental_Analyzer (AI analysis)
    ↓
Analyst_Caller (webhook to N8N)
```

**Performance Characteristics**:
- **Throughput**: 60 FPS (1920×1080)
- **Latency**: <50ms per frame
- **GPU Memory**: ~4GB (RTX 3060)
- **Detection Accuracy**: 95%+ (species-dependent)

---

### Component 2: N8N RTSP Analyst Workflow

**Purpose**: Deep AI-powered ecological analysis with 9 specialized agents

**Technology Stack**:
- **Orchestration**: N8N workflow automation
- **AI Model**: OpenAI GPT-4o
- **Data Sources**: 12+ scientific APIs
- **Output**: 72 structured data points

**9 AI Agents Architecture**:
```
1. Systematics Phenologist
   ├─ Input: Species detection data
   ├─ Databases: GBIF, iNaturalist
   ├─ Output:
   │   ├─ Taxonomic classification (Kingdom → Species)
   │   ├─ Phenological stage
   │   ├─ Breeding season match
   │   ├─ Migration route overlap
   │   └─ Temporal activity patterns
   └─ Data Points: 15

2. GIS Data Manager
   ├─ Input: Coordinates, timestamp
   ├─ Services: OpenStreetMap, OpenTopoData, Open Elevation
   ├─ Output:
   │   ├─ Validated coordinates
   │   ├─ Location context (city, region, country)
   │   ├─ Elevation/depth
   │   ├─ Geographic zone
   │   └─ Biogeographic region
   └─ Data Points: 8

3. Biodiversity Intelligence
   ├─ Input: Species name, location
   ├─ Databases: IUCN, GBIF, iNaturalist
   ├─ Output:
   │   ├─ IUCN conservation status
   │   ├─ GBIF occurrence count
   │   ├─ Species rarity score (0.0-1.0)
   │   ├─ Rarity justification
   │   ├─ Endemic status
   │   ├─ Ecological role
   │   └─ Functional group
   └─ Data Points: 9

4. EnviroStatus Manager
   ├─ Input: Species, location, environmental data
   ├─ Services: API Ninjas, Open-Meteo
   ├─ Output:
   │   ├─ Habitat type
   │   ├─ Ecosystem classification
   │   ├─ Environmental suitability score
   │   └─ Habitat quality assessment
   └─ Data Points: 6

5. Marine Climate Search
   ├─ Input: Coordinates (if marine)
   ├─ Services: NOAA Co-OPS, Open-Meteo Marine
   ├─ Output:
   │   ├─ Marine zone (neritic, oceanic, etc.)
   │   ├─ Sea surface temperature
   │   ├─ Ocean currents
   │   ├─ Wave height
   │   ├─ Salinity
   │   └─ Bathymetry
   └─ Data Points: 8 (marine only)

6. Terrestrial Climate Search
   ├─ Input: Coordinates (if terrestrial)
   ├─ Services: Open-Meteo, SOILGRIDS
   ├─ Output:
   │   ├─ Biome classification
   │   ├─ Air temperature
   │   ├─ Soil temperature
   │   ├─ Precipitation
   │   ├─ Humidity
   │   ├─ Atmospheric pressure
   │   └─ Soil type/pH
   └─ Data Points: 8 (terrestrial only)

7. Habitat Assessment
   ├─ Input: All environmental data
   ├─ Services: NDVI, Land Cover APIs
   ├─ Output:
   │   ├─ Vegetation density (NDVI)
   │   ├─ Land cover type
   │   ├─ Substrate type
   │   ├─ Ecosystem health score
   │   └─ Habitat degradation indicators
   └─ Data Points: 7

8. Cartography Mapper
   ├─ Input: Coordinates
   ├─ Services: Mapbox, NOAA, OpenStreetMap
   ├─ Output:
   │   ├─ Satellite imagery (3 zoom levels: 10, 12, 14)
   │   ├─ Marine enhancements (if coastal)
   │   ├─ NOAA station data
   │   ├─ Bathymetric charts
   │   └─ Spatial context analysis
   └─ Data Points: 10

9. Memory Manager
   ├─ Input: All agent outputs + historical data
   ├─ Database: Airtable (past observations)
   ├─ Output:
   │   ├─ Spatiotemporal context
   │   ├─ Pattern recognition
   │   ├─ Anomaly detection
   │   ├─ Observation history summary
   │   └─ Trend analysis
   └─ Data Points: 5
```

**Agent Interaction Flow**:
```
Webhook Trigger (Detection Data)
    ↓
Parallel Execution:
    ├─ Systematics Phenologist → Taxonomic + Phenology
    ├─ GIS Data Manager → Location Context
    ├─ Biodiversity Intelligence → Conservation Metrics
    ├─ EnviroStatus Manager → Habitat Assessment
    ├─ Marine/Terrestrial Climate → Environmental Data
    ├─ Habitat Assessment → Ecosystem Health
    └─ Cartography Mapper → Spatial Imagery
    ↓
Sequential Execution:
    └─ Memory Manager → Synthesize All Data + Historical Context
    ↓
Data Aggregation (72 data points)
    ↓
Airtable Write (2 tables)
    ↓
Webhook Response (Success/Failure)
```

**Error Handling**:
- API failures → Retry with exponential backoff (3 attempts)
- Missing data → Use default values with data quality flags
- Invalid responses → Log error, continue pipeline with partial data

---

### Component 3: Daily Reporter N8N Workflow

**Purpose**: Automated generation of publication-quality environmental intelligence reports

**Technology Stack**:
- **Orchestration**: N8N workflow automation
- **AI Model**: OpenAI GPT-4o
- **PDF Generation**: API Template
- **Data Source**: Airtable database

**5 Report AI Agents**:
```
1. Species & Biodiversity Analyst
   ├─ Input: Species Observations table (all records from last 24h)
   ├─ Analysis:
   │   ├─ Species diversity metrics
   │   ├─ Taxonomic composition
   │   ├─ Conservation status distribution
   │   ├─ Rarity assessments
   │   ├─ Endemic species count
   │   ├─ Ecological roles distribution
   │   └─ Temporal activity patterns
   └─ Output: Comprehensive species biodiversity section

2. Environmental & Climate Analyst
   ├─ Input: Environmental data from both tables
   ├─ Analysis:
   │   ├─ Marine/terrestrial climate trends
   │   ├─ Temperature variations
   │   ├─ Precipitation patterns
   │   ├─ Oceanographic conditions
   │   ├─ Atmospheric conditions
   │   └─ Environmental anomalies
   └─ Output: Environmental assessment section

3. Habitat & Conservation Analyst
   ├─ Input: Habitat data + conservation metrics
   ├─ Analysis:
   │   ├─ Habitat type distribution
   │   ├─ Ecosystem health scores
   │   ├─ Conservation implications
   │   ├─ Threatened species observations
   │   ├─ Habitat degradation indicators
   │   └─ Management recommendations
   └─ Output: Conservation assessment section

4. Cartography & Spatial Analyst
   ├─ Input: Satellite imagery + spatial data
   ├─ Analysis:
   │   ├─ Spatial distribution patterns
   │   ├─ Geographic clustering
   │   ├─ Habitat connectivity
   │   ├─ Satellite imagery interpretation
   │   ├─ Bathymetric analysis (marine)
   │   └─ Elevation patterns (terrestrial)
   └─ Output: Spatial intelligence section

5. Report Synthesis Agent
   ├─ Input: All 4 analyst outputs
   ├─ Synthesis:
   │   ├─ Executive dashboard (key metrics)
   │   ├─ Cross-domain insights
   │   ├─ Data quality assessment
   │   ├─ FAIR compliance checklist
   │   ├─ Research recommendations
   │   └─ Data gaps identification
   └─ Output: Complete integrated report
```

**Report Structure**:
```markdown
# Daily Environmental Intelligence Report
## [Date Range]

### Executive Dashboard
- Total observations: X
- Unique species: X
- Conservation status: [distribution]
- Data quality score: X/100
- FAIR compliance: ✓/✗ for each principle

### Species & Biodiversity Analysis
[Species & Biodiversity Analyst output]

### Environmental & Climate Assessment
[Environmental & Climate Analyst output]

### Habitat & Conservation Status
[Habitat & Conservation Analyst output]

### Cartography & Spatial Intelligence
[Cartography & Spatial Analyst output]

### Data Quality & FAIR Compliance
- Findable: [assessment]
- Accessible: [assessment]
- Interoperable: [assessment]
- Reusable: [assessment]

### Research Recommendations
[Synthesis Agent recommendations]

### Appendices
- Data sources
- Methodology
- Limitations
- Contact information
```

**PDF Generation Pipeline**:
```
Scheduled Trigger (Daily at 00:00 UTC)
    ↓
Fetch Last 24h Data from Airtable
    ↓
Parallel Agent Analysis:
    ├─ Species & Biodiversity Analyst
    ├─ Environmental & Climate Analyst
    ├─ Habitat & Conservation Analyst
    └─ Cartography & Spatial Analyst
    ↓
Report Synthesis Agent (integrate all outputs)
    ↓
API Template PDF Generation
    ↓
Upload PDF to Storage
    ↓
Email/Webhook Notification
```

---

### Component 4: Airtable Database

**Purpose**: Research-grade structured data storage with relational architecture

**Database Schema**:

**Table 1: Species Observations (62 columns)**
```
Primary Key: Observation ID (UUID)

Column Groups:
├─ Taxonomic Data (12 columns)
│   ├─ Species Name, Common Name, Scientific Name
│   ├─ Kingdom, Phylum, Class, Order, Family, Genus, Species
│   └─ GBIF Usage Key
│
├─ Phenological Data (9 columns)
│   ├─ Observation Time, Season, Life Stage
│   ├─ Breeding Season Match, Migration Route Overlap
│   ├─ Temporal Activity Pattern, Age Class
│   └─ Reproductive Status, Behavior Notes
│
├─ Biodiversity Metrics (8 columns)
│   ├─ GBIF Occurrence Count, IUCN Conservation Status
│   ├─ Species Rarity Score, Species Rarity Reason
│   ├─ Endemic Species, Ecological Role
│   └─ Trophic Level, Functional Group
│
├─ Geographic Data (10 columns)
│   ├─ Latitude, Longitude, Location, Region, Country
│   ├─ Geographic Zone, Habitat Type, Elevation, Depth
│   └─ Biogeographic Region
│
├─ Environmental Conditions (15 columns)
│   ├─ Marine Zone, Terrestrial Biome
│   ├─ Air Temperature, Soil Temperature, Water Temperature
│   ├─ Precipitation, Humidity, Atmospheric Pressure
│   ├─ Ocean Current, Wave Height, Substrate Type
│   ├─ Land Cover Type, Vegetation Density
│   └─ Water Quality Index, Pollution Level
│
└─ Metadata (8 columns)
    ├─ Detection Confidence, Image URL, Video Timestamp
    ├─ Data Source, Quality Score, Verified, Verified By
    └─ Notes

Data Types:
- Single line text: Species names, classifications
- Number: Coordinates, measurements, scores
- Date & time: Timestamps
- Single select: Categories (Season, Conservation Status)
- Checkbox: Boolean flags
- Long text: Descriptions, analyses, notes
- URL: Image/video links
```

**Table 2: Environmental Mapping (10 columns)**
```
Primary Key: Observation ID (UUID)
Foreign Key: Links to Species Observations table

Columns:
├─ Observation ID (Link to Species Observations)
├─ Satellite Imagery Zoom 10 (URL)
├─ Satellite Imagery Zoom 12 (URL)
├─ Satellite Imagery Zoom 14 (URL)
├─ Marine Enhancement Data (Long text, JSON)
├─ NOAA Station Data (Long text, JSON)
├─ Bathymetry Data (Long text, JSON)
├─ Cartographic Analysis (Long text)
├─ Spatial Context (Long text)
└─ Timestamp (Date & time)

Purpose:
- Store satellite imagery at multiple zoom levels
- Preserve marine-specific enhancements (coastal areas)
- Link cartographic analysis to observations
- Enable spatial queries and visualizations
```

**Data Relationships**:
```
Species Observations (1) ←→ (1) Environmental Mapping
    Observation ID = Observation ID

Query Examples:
1. Find all observations with satellite imagery
2. Get marine enhancements for coastal detections
3. Link species to bathymetric data
4. Spatial clustering by coordinates
```

**Data Quality Controls**:
- **Validation Rules**: Coordinates within valid ranges, required fields non-null
- **Constraints**: Conservation status must be valid IUCN category
- **Triggers**: Auto-timestamp on record creation
- **Quality Score**: Calculated based on data completeness (0-100)

---

## Data Flow Architecture

### End-to-End Data Flow
```
[Video Frame] 60 FPS
    ↓
[YOLOv11 Detection] → Bounding box + confidence
    ↓
[ByteTrack] → Track ID assignment
    ↓
[Detection_Converter] → Structured JSON
    ↓
Every 15 seconds:
    ↓
[Batch Accumulator] → Collect detections
    ↓
[Anthropic_Environmental_Analyzer] → Environmental context
    ↓
[Analyst_Caller] → HTTP POST to N8N
    ↓
[N8N Webhook] → Receive detection batch
    ↓
[Parallel Agent Execution]
    ├─ [Systematics Phenologist] → GBIF → Taxonomic data
    ├─ [GIS Data Manager] → OpenStreetMap → Location data
    ├─ [Biodiversity Intelligence] → IUCN → Conservation data
    ├─ [EnviroStatus Manager] → API Ninjas → Habitat data
    ├─ [Marine Climate] → NOAA → Marine data
    ├─ [Terrestrial Climate] → Open-Meteo → Climate data
    ├─ [Habitat Assessment] → NDVI → Vegetation data
    └─ [Cartography Mapper] → Mapbox → Imagery
    ↓
[Memory Manager] → Historical context + pattern recognition
    ↓
[Data Aggregation] → 72 data points
    ↓
[Airtable Write]
    ├─ Species Observations table → 62 columns
    └─ Environmental Mapping table → 10 columns
    ↓
[Webhook Response] → Success confirmation
    ↓
[Continue Real-Time Processing]

Daily at 00:00 UTC:
    ↓
[Daily Reporter Trigger]
    ↓
[Airtable Query] → Fetch last 24h records
    ↓
[Parallel Report Agent Analysis]
    ├─ [Species & Biodiversity Analyst]
    ├─ [Environmental & Climate Analyst]
    ├─ [Habitat & Conservation Analyst]
    └─ [Cartography & Spatial Analyst]
    ↓
[Report Synthesis Agent] → Integrate all analyses
    ↓
[API Template] → Generate PDF
    ↓
[Upload & Notify] → Distribute report
```

### Data Transformation Stages

**Stage 1: Detection Data (Roboflow)**
```json
{
  "class": "Hummingbird",
  "confidence": 0.94,
  "bbox": [120, 340, 180, 420],
  "track_id": 42,
  "timestamp": "2025-11-27T14:32:15.123Z"
}
```

**Stage 2: Environmental Analysis (Claude)**
```json
{
  "species": "Hummingbird",
  "environmental_context": "Tropical rainforest environment...",
  "behavioral_notes": "Hovering flight pattern observed...",
  "temporal_significance": "Midday activity consistent with..."
}
```

**Stage 3: N8N Agent Analysis (72 data points)**
```json
{
  "observation_id": "uuid-12345",
  "taxonomic": {
    "kingdom": "Animalia",
    "phylum": "Chordata",
    "class": "Aves",
    "order": "Apodiformes",
    "family": "Trochilidae",
    "genus": "Amazilia",
    "species": "Amazilia tzacatl",
    "common_name": "Rufous-tailed Hummingbird",
    "gbif_usage_key": 2480523
  },
  "phenology": {
    "season": "Summer",
    "life_stage": "Adult",
    "breeding_season_match": true,
    "temporal_pattern": "Diurnal foraging"
  },
  "biodiversity": {
    "iucn_status": "LC",
    "rarity_score": 0.23,
    "endemic": false,
    "ecological_role": "Pollinator"
  },
  "geography": {
    "latitude": 10.234,
    "longitude": -84.567,
    "country": "Costa Rica",
    "habitat": "Tropical rainforest"
  },
  "environment": {
    "temperature": 28.5,
    "humidity": 85,
    "vegetation_density": 92
  }
  // ... 72 total fields
}
```

**Stage 4: Airtable Storage (Relational)**
```
Species Observations Table:
[Observation ID] [Species Name] [Kingdom] ... [62 columns total]

Environmental Mapping Table:
[Observation ID] [Satellite Zoom 10] [Satellite Zoom 12] ... [10 columns total]
```

**Stage 5: Daily Report (PDF)**
```markdown
# Daily Environmental Intelligence Report
## November 27, 2025

### Executive Dashboard
- 247 observations across 34 species
- 3 Endangered species detected
- Data quality: 94/100

### Species Highlights
Rufous-tailed Hummingbird (Amazilia tzacatl):
- 18 observations
- IUCN: Least Concern
- Ecological role: Critical pollinator
...
```

---

## API Integration Architecture

### Scientific Databases

**GBIF (Global Biodiversity Information Facility)**
- **Purpose**: Taxonomic validation, occurrence data
- **Endpoint**: `https://api.gbif.org/v1/species/match`
- **Rate Limit**: None
- **Data Retrieved**: Scientific classification, usage key, occurrence count

**iNaturalist**
- **Purpose**: Community observations, phenology
- **Endpoint**: `https://api.inaturalist.org/v1/observations`
- **Rate Limit**: 60 requests/minute
- **Data Retrieved**: Observation counts, identification confidence

**IUCN Red List**
- **Purpose**: Conservation status
- **Endpoint**: `https://apiv3.iucnredlist.org/api/v3/species/`
- **Rate Limit**: 100 requests/day (requires token)
- **Data Retrieved**: Conservation status, population trends

### Environmental Data

**Open-Meteo**
- **Purpose**: Climate data (marine + terrestrial)
- **Endpoints**:
  - Terrestrial: `https://api.open-meteo.com/v1/forecast`
  - Marine: `https://marine-api.open-meteo.com/v1/marine`
- **Rate Limit**: None
- **Data Retrieved**: Temperature, precipitation, currents, wave height

**NOAA Co-OPS**
- **Purpose**: Marine station data
- **Endpoint**: `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter`
- **Rate Limit**: None
- **Data Retrieved**: Water levels, currents, temperature, salinity

**SOILGRIDS**
- **Purpose**: Soil data
- **Endpoint**: `https://rest.isric.org/soilgrids/v2.0/properties/query`
- **Rate Limit**: None
- **Data Retrieved**: Soil type, pH, organic carbon

### Geospatial Services

**Mapbox**
- **Purpose**: Satellite imagery
- **Endpoint**: `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/`
- **Rate Limit**: 200,000 requests/month (free tier)
- **Data Retrieved**: Satellite imagery at zoom levels 10, 12, 14

**OpenStreetMap Nominatim**
- **Purpose**: Reverse geocoding
- **Endpoint**: `https://nominatim.openstreetmap.org/reverse`
- **Rate Limit**: 1 request/second
- **Data Retrieved**: Location names, administrative boundaries

**OpenTopoData**
- **Purpose**: Elevation data
- **Endpoint**: `https://api.opentopodata.org/v1/`
- **Rate Limit**: 100 requests/day (free tier)
- **Data Retrieved**: Elevation, bathymetry

### API Error Handling
```python
# Retry mechanism with exponential backoff
def call_api_with_retry(url, max_retries=3):
    for attempt in range(max_retries):
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            if attempt == max_retries - 1:
                # Log error, return default value
                logger.error(f"API call failed after {max_retries} attempts: {e}")
                return {"error": str(e), "default": True}
            time.sleep(2 ** attempt)  # Exponential backoff: 1s, 2s, 4s
```

---

## Deployment Architecture

### Cloud Deployment (Recommended)
```
┌─────────────────────────────────────────────────────┐
│                   Cloud Architecture                 │
├─────────────────────────────────────────────────────┤
│                                                       │
│  [RTSP Camera] → [Roboflow Cloud]                   │
│                        ↓                              │
│                  [N8N Cloud]                         │
│                 (9 AI Agents)                        │
│                        ↓                              │
│                  [Airtable]                          │
│                        ↓                              │
│              [Daily Reporter]                        │
│                 (5 AI Agents)                        │
│                        ↓                              │
│                   [PDF Storage]                      │
│                                                       │
└─────────────────────────────────────────────────────┘

Advantages:
- No infrastructure management
- Auto-scaling
- High availability
- Managed backups

Costs (estimated monthly):
- Roboflow Cloud: $99-299
- N8N Cloud: $20-50
- Airtable: $10-20
- API costs: $50-100
Total: ~$180-470/month
```

### Edge Deployment (Field Research)
```
┌─────────────────────────────────────────────────────┐
│                   Edge Architecture                  │
├─────────────────────────────────────────────────────┤
│                                                       │
│  [Local Camera] → [Edge Device: NVIDIA Jetson]      │
│                           ↓                           │
│                   [Roboflow Inference]               │
│                 (Local YOLOv11 model)                │
│                           ↓                           │
│                   [Local N8N Instance]               │
│                    (9 AI Agents)                     │
│                           ↓                           │
│                [Local SQLite/PostgreSQL]             │
│                           ↓                           │
│       [Periodic Sync to Cloud Airtable]             │
│                                                       │
└─────────────────────────────────────────────────────┘

Advantages:
- Works offline
- Low latency
- Data sovereignty
- Lower ongoing costs

Requirements:
- NVIDIA Jetson AGX Xavier or equivalent
- 32GB RAM, 512GB SSD
- 4G/5G connectivity for sync
```

### Hybrid Deployment (Production)
```
┌─────────────────────────────────────────────────────┐
│                  Hybrid Architecture                 │
├─────────────────────────────────────────────────────┤
│                                                       │
│  Edge:                         Cloud:                │
│  [RTSP Camera]                 [N8N Cloud]          │
│        ↓                             ↓               │
│  [Jetson Xavier]               [AI Agents]          │
│  YOLOv11 @ 60 FPS              Deep Analysis        │
│        ↓                             ↓               │
│  [Local Queue]                 [Airtable]           │
│        ↓                             ↓               │
│  [Batch Upload via 4G/5G]      [Daily Reporter]     │
│                                                       │
└─────────────────────────────────────────────────────┘

Advantages:
- Best of both worlds
- Real-time processing at edge
- Deep analysis in cloud
- Resilient to network outages
```

---

## Performance Characteristics

### Throughput Metrics

- **Video Processing**: 60 FPS @ 1920×1080
- **Detection Latency**: <50ms per frame
- **Analysis Latency**: 5-15 seconds (parallel agent execution)
- **Database Write**: <2 seconds per observation
- **Report Generation**: 30-60 seconds for 24h data

### Scalability

**Horizontal Scaling**:
- Add N8N workers: Linear scaling of analysis throughput
- Add Roboflow instances: Parallel video stream processing
- Shard Airtable: Distribute data across bases

**Vertical Scaling**:
- GPU upgrade: Higher resolution or frame rate
- Increase RAM: Larger detection batches
- Faster CPU: Quicker AI agent responses

### Resource Requirements

**Per Camera Stream (60 FPS)**:
- GPU: 4GB VRAM
- RAM: 8GB
- CPU: 4 cores
- Network: 5 Mbps upload (for cloud sync)
- Storage: 10 GB/day (with image retention)

---

## Security Architecture

**API Key Management**:
- `.env` files for local development
- N8N credential vault for production
- Environment variables for cloud deployment
- Never commit credentials to Git

**Data Privacy**:
- No PII collection
- Coordinates truncated to 3 decimal places (public sharing)
- Image URLs expire after 30 days
- GDPR compliant

**Access Control**:
- Airtable: Role-based access (Owner, Editor, Commenter, Read-only)
- N8N: Workflow-level permissions
- API keys: Scoped to minimum required permissions

---

## Conclusion

Audtheia's architecture enables a unique combination of real-time monitoring and deep ecological analysis by separating computational concerns into specialized, asynchronous components. This design pattern is scalable from single-camera edge deployments to multi-site cloud-based observatories, making it suitable for both field researchers and large institutions like NOAA and MBARI.

The system produces research-grade data (72 points per observation) suitable for peer-reviewed publications while maintaining the processing speed (60 FPS) required for continuous environmental monitoring. The FAIR data principles ensure long-term scientific value and interoperability with existing research ecosystems.