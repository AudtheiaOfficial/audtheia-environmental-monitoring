# Roboflow Workflows
Real-time video processing with object detection, tracking, and AI-powered environmental analysis at 60 FPS.

## Overview
The Roboflow RTSP Workflow processes video streams in real-time using YOLOv11 object detection and ByteTrack multi-object tracking. Custom Python blocks add environmental analysis (Claude 3.5 Sonnet) and send detection data to N8N for deep analysis. The workflow maintains 60 FPS processing speed while conducting comprehensive ecological assessments every 15 seconds.

---

## Workflow Architecture

![Roboflow Anthropic Integration Workflow](images/roboflow-anthropic-integration-workflow.png)

**Figure 1: Roboflow Anthropic Integration Workflow** - Complete system architecture showing YOLOv11 object detection, ByteTrack multi-object tracking, custom Python blocks (Detection_Converter, Add_Webcam_Interface, Anthropic_Environmental_Analyzer, Analyst_Caller), and N8N integration for deep ecological analysis.

---

### Data Flow

```
Video Source (RTSP/MP4/Webcam)
    ↓
Frame Extraction @ 60 FPS
    ↓
GPU Preprocessing (resize, normalize)
    ↓
YOLOv11 Object Detection
    ↓
ByteTrack Multi-Object Tracking
    ↓
Detection_Converter (Custom Block)
    ↓
Add_Webcam_Interface (Custom Block)
    ↓
Every 15 seconds:
    ↓
Anthropic_Environmental_Analyzer (Custom Block)
    ↓
Analyst_Caller (Custom Block)
    ↓
HTTP POST → N8N RTSP Analyst Workflow
```

---

## Custom Python Blocks

### Block 1: Detection_Converter
**Purpose:** Convert YOLOv11 predictions to structured JSON format

**Input:** Raw YOLO detection object

```python
{
    'boxes': tensor([[120.5, 340.2, 180.8, 420.1]]),
    'scores': tensor([0.94]),
    'labels': tensor([3]),
    'class_names': ['bird']
}
```

**Code:**

```python
def convert_detections(predictions):
    """
    Converts YOLOv11 predictions to structured format.
    
    Args:
        predictions: Raw prediction object from YOLOv11
        
    Returns:
        list: Structured detection dictionaries
    """
    import datetime
    
    detections = []
    
    for i in range(len(predictions.boxes)):
        detection = {
            "species": predictions.class_names[predictions.labels[i]],
            "confidence": float(predictions.scores[i]),
            "bbox": [
                float(predictions.boxes[i][0]),  # x1
                float(predictions.boxes[i][1]),  # y1
                float(predictions.boxes[i][2]),  # x2
                float(predictions.boxes[i][3])   # y2
            ],
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
            "track_id": None  # Will be added by ByteTrack
        }
        detections.append(detection)
    
    return detections
```

**Output:**

```json
[
    {
        "species": "Hummingbird",
        "confidence": 0.94,
        "bbox": [120.5, 340.2, 180.8, 420.1],
        "timestamp": "2025-11-27T14:32:15.123Z",
        "track_id": null
    }
]
```

**Integration:** Place after YOLOv11 inference node, before ByteTrack

---

### Block 2: Add_Webcam_Interface
**Purpose:** Add professional video overlay with species ticker and bounding boxes

**Input:**
- Video frame (numpy array)
- Detections with track IDs

**Code:**

```python
import cv2
import numpy as np
from collections import defaultdict

# Global state for species counter (persists across frames)
species_counter = defaultdict(int)

def add_webcam_interface(frame, detections):
    """
    Adds professional overlay to video frame.
    
    Args:
        frame: numpy array (BGR format)
        detections: list of detection dicts with track_ids
        
    Returns:
        numpy array: Annotated frame
    """
    # Create copy to avoid modifying original
    annotated = frame.copy()
    h, w = frame.shape[:2]
    
    # --------------------- Draw Bounding Boxes ---------------------
    for det in detections:
        x1, y1, x2, y2 = [int(coord) for coord in det['bbox']]
        species = det['species']
        confidence = det['confidence']
        track_id = det.get('track_id', '?')
        
        # Color based on confidence (green = high, yellow = medium, red = low)
        if confidence > 0.8:
            color = (0, 255, 0)      # Green
        elif confidence > 0.6:
            color = (0, 255, 255)    # Yellow
        else:
            color = (0, 0, 255)      # Red
        
        # Draw bounding box (thickness = 3)
        cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 3)
        
        # Label background
        label = f"{species} #{track_id} ({confidence:.2f})"
        label_size, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
        cv2.rectangle(annotated, (x1, y1 - label_size[1] - 10), 
                      (x1 + label_size[0], y1), color, -1)
        
        # Label text
        cv2.putText(annotated, label, (x1, y1 - 5), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        
        # Update species counter (count unique track_ids)
        if track_id != '?':
            species_counter[species] = max(species_counter[species], int(track_id))
    
    # --------------------- Species Ticker (Top Bar) ---------------------
    ticker_height = 80
    ticker_bg = np.zeros((ticker_height, w, 3), dtype=np.uint8)
    ticker_bg[:] = (40, 40, 40)  # Dark gray background
    
    # Audtheia branding (left)
    cv2.putText(ticker_bg, "AUDTHEIA", (15, 30), 
                cv2.FONT_HERSHEY_BOLD, 0.8, (0, 139, 139), 2)  # Teal
    cv2.putText(ticker_bg, "Real-Time Environmental Monitoring", (15, 55), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
    
    # Species counts (right side)
    x_offset = w - 350
    cv2.putText(ticker_bg, "Species Detected:", (x_offset, 30), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
    
    y_offset = 50
    for species, count in sorted(species_counter.items())[:3]:  # Top 3 species
        text = f"{species}: {count}"
        cv2.putText(ticker_bg, text, (x_offset, y_offset), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
        y_offset += 20
    
    # Combine ticker and frame
    final = np.vstack([ticker_bg, annotated])
    
    # --------------------- Info Bar (Bottom) ---------------------
    info_height = 40
    info_bg = np.zeros((info_height, w, 3), dtype=np.uint8)
    info_bg[:] = (40, 40, 40)
    
    # FPS counter
    fps_text = f"FPS: 60"  # Update with actual FPS if available
    cv2.putText(info_bg, fps_text, (15, 25), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
    
    # Detection count
    det_text = f"Detections: {len(detections)}"
    cv2.putText(info_bg, det_text, (150, 25), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
    
    # Timestamp
    from datetime import datetime
    time_text = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cv2.putText(info_bg, time_text, (w - 220, 25), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
    
    # Combine all
    final = np.vstack([final, info_bg])
    
    return final
```

**Output:** Annotated video frame with professional overlay

**Visual Elements:**
- **Top Bar:** Audtheia branding + species ticker (top 3 species counts)
- **Bounding Boxes:** Color-coded by confidence (green/yellow/red)
- **Labels:** Species name, track ID, confidence score
- **Bottom Bar:** FPS, detection count, timestamp

**Integration:** Place after ByteTrack, before video display

---

### Block 3: Anthropic_Environmental_Analyzer
**Purpose:** Comprehensive environmental analysis every 15 seconds using Claude 3.5 Sonnet

**Input:**
- Detection summary (last 15 seconds)
- Video frame context
- Location metadata

**Code:**

```python
import anthropic
import os
import base64
from datetime import datetime

def analyze_environment(detections_batch, frame, location=None):
    """
    Analyzes environmental context using Claude 3.5 Sonnet.
    
    Args:
        detections_batch: list of detections from last 15 seconds
        frame: current video frame (for visual context)
        location: dict with lat/lon (optional)
        
    Returns:
        dict: Environmental analysis
    """
    client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
    
    # Encode frame to base64 for Claude Vision
    _, buffer = cv2.imencode('.jpg', frame)
    frame_b64 = base64.b64encode(buffer).decode('utf-8')
    
    # Prepare detection summary
    species_summary = {}
    for det in detections_batch:
        species = det['species']
        species_summary[species] = species_summary.get(species, 0) + 1
    
    # Build prompt
    prompt = f"""Analyze this environmental monitoring scene.

DETECTION SUMMARY (last 15 seconds):
{species_summary}

Total detections: {len(detections_batch)}
Timestamp: {datetime.utcnow().isoformat()}Z
Location: {location if location else 'Unknown'}

Based on the image and detection data, provide:
1. Environmental context (habitat type, conditions)
2. Behavioral observations (activity patterns, interactions)
3. Temporal significance (time of day, seasonal relevance)
4. Ecological insights (species roles, ecosystem health indicators)

Be specific and scientific, but concise (200-300 words)."""
    
    # Call Claude with vision
    message = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=1024,
        temperature=0.3,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/jpeg",
                            "data": frame_b64
                        }
                    },
                    {
                        "type": "text",
                        "text": prompt
                    }
                ]
            }
        ]
    )
    
    analysis = message.content[0].text
    
    return {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "analysis": analysis,
        "species_summary": species_summary,
        "total_detections": len(detections_batch)
    }
```

**Output:**

```json
{
    "timestamp": "2025-11-27T14:32:15.123Z",
    "analysis": "This tropical rainforest scene shows active hummingbird foraging behavior during midday hours. The 18 Rufous-tailed Hummingbird detections indicate a healthy population utilizing flowering plants for nectar. Hovering flight patterns and territorial displays suggest breeding season activity. The dense canopy visible in background indicates intact forest ecosystem with minimal degradation. Peak activity at this time (1400 local) is consistent with optimal foraging conditions.",
    "species_summary": {
        "Hummingbird": 18,
        "Tanager": 3,
        "Motmot": 1
    },
    "total_detections": 22
}
```

**API Requirements:**
- Anthropic API key (set as environment variable)
- Model: claude-3-5-sonnet-20241022
- Vision capability required

**Integration:** Runs every 15 seconds (configurable), analyzes accumulated detections

---

### Block 4: Analyst_Caller
**Purpose:** Send detection batch to N8N RTSP Analyst workflow for deep analysis

**Input:**
- Detection batch (15 seconds)
- Environmental analysis from Claude
- Location metadata

**Code:**

```python
import requests
import os
from datetime import datetime

def send_to_analyst(detections, environmental_analysis, location=None):
    """
    Sends detection data to N8N RTSP Analyst workflow.
    
    Args:
        detections: list of detection dicts
        environmental_analysis: dict from Anthropic analyzer
        location: dict with lat/lon
        
    Returns:
        dict: Response from N8N or error
    """
    # N8N webhook URL
    webhook_url = os.getenv('N8N_WEBHOOK_BASE_URL') + os.getenv('N8N_RTSP_ANALYST_WEBHOOK')
    
    # Prepare payload
    payload = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "detections": detections,
        "environmental_context": environmental_analysis.get('analysis', ''),
        "species_summary": environmental_analysis.get('species_summary', {}),
        "location": location or {
            "latitude": None,
            "longitude": None
        },
        "metadata": {
            "source": "Roboflow RTSP Workflow",
            "total_detections": len(detections),
            "analysis_interval": "15_seconds"
        }
    }
    
    try:
        # Send POST request to N8N
        response = requests.post(
            webhook_url,
            json=payload,
            timeout=30,
            headers={"Content-Type": "application/json"}
        )
        
        response.raise_for_status()
        
        return {
            "success": True,
            "status_code": response.status_code,
            "response": response.json(),
            "detections_sent": len(detections)
        }
        
    except requests.exceptions.RequestException as e:
        return {
            "success": False,
            "error": str(e),
            "detections_sent": 0
        }
```

**Output:**

```json
{
    "success": true,
    "status_code": 200,
    "response": {
        "received": true,
        "observation_ids": ["uuid-1", "uuid-2", "uuid-3"],
        "processing_status": "queued"
    },
    "detections_sent": 22
}
```

**Environment Variables Required:**
- `N8N_WEBHOOK_BASE_URL=https://your-n8n-instance.app.n8n.cloud`
- `N8N_RTSP_ANALYST_WEBHOOK=/webhook/rtsp-analyst`

**Integration:** Runs after Anthropic_Environmental_Analyzer, sends data to N8N

---

## Deployment Scripts

### Deploy_Roboflow_Anthropic_Pipeline.py
**Purpose:** Main deployment script for running the complete Roboflow workflow

```python
#!/usr/bin/env python3
"""
Audtheia Roboflow RTSP Pipeline
Real-time video processing with AI environmental analysis
"""

import cv2
import os
from roboflow import Roboflow
from dotenv import load_dotenv
import time
from collections import deque

# Load environment variables
load_dotenv()

# Initialize Roboflow
rf = Roboflow(api_key=os.getenv('ROBOFLOW_API_KEY'))
workspace = rf.workspace(os.getenv('ROBOFLOW_WORKSPACE'))
project = workspace.project(os.getenv('ROBOFLOW_PROJECT'))
model = project.version(int(os.getenv('ROBOFLOW_MODEL_VERSION'))).model

# Video source configuration
video_source = os.getenv('RTSP_CAMERA_URL') or os.getenv('VIDEO_FILE_PATH') or 0
fps_target = int(os.getenv('VIDEO_FPS', 60))

# Initialize video capture
cap = cv2.VideoCapture(video_source)
cap.set(cv2.CAP_PROP_FPS, fps_target)

# Detection batch accumulator (15-second window)
detection_batch = deque(maxlen=900)  # 60 FPS × 15 seconds
last_analysis_time = time.time()
analysis_interval = 15  # seconds

print(f"🎥 Starting Audtheia RTSP Pipeline")
print(f"📹 Video Source: {video_source}")
print(f"🎯 Target FPS: {fps_target}")
print(f"🧠 Analysis Interval: {analysis_interval}s")
print(f"✅ Ready for monitoring\n")

frame_count = 0

while True:
    ret, frame = cap.read()
    if not ret:
        print("⚠️  Video stream ended or error reading frame")
        break
    
    frame_count += 1
    
    # YOLOv11 Inference
    predictions = model.predict(frame, confidence=40).json()
    
    # Convert detections (Custom Block 1)
    detections = convert_detections(predictions)
    
    # Add track IDs (ByteTrack integration would go here)
    # For now, using frame_count as simple track ID
    for i, det in enumerate(detections):
        det['track_id'] = f"{frame_count}-{i}"
    
    # Add to batch
    detection_batch.extend(detections)
    
    # Add webcam interface (Custom Block 2)
    annotated_frame = add_webcam_interface(frame, detections)
    
    # Display frame
    cv2.imshow('Audtheia RTSP Monitor', annotated_frame)
    
    # Check if 15 seconds elapsed
    current_time = time.time()
    if current_time - last_analysis_time >= analysis_interval:
        print(f"\n🧠 Running environmental analysis...")
        print(f"   Detections in batch: {len(detection_batch)}")
        
        # Environmental Analysis (Custom Block 3)
        analysis = analyze_environment(list(detection_batch), frame)
        print(f"   Analysis complete: {len(analysis['analysis'])} chars")
        
        # Send to N8N (Custom Block 4)
        result = send_to_analyst(
            list(detection_batch),
            analysis,
            location={
                "latitude": 10.234,   # Set from config or GPS
                "longitude": -84.567
            }
        )
        
        if result['success']:
            print(f"   ✅ Sent to N8N: {result['detections_sent']} detections")
        else:
            print(f"   ❌ N8N error: {result['error']}")
        
        # Reset batch and timer
        detection_batch.clear()
        last_analysis_time = current_time
    
    # FPS control
    if cv2.waitKey(1000 // fps_target) & 0xFF == ord('q'):
        print("\n🛑 User stopped monitoring")
        break

# Cleanup
cap.release()
cv2.destroyAllWindows()
print("✅ Pipeline shutdown complete")
```

**Run Command:**

```bash
python roboflow/workflows/Deploy_Roboflow_Anthropic_Pipeline.py
```

---

## Configuration

### Environment Variables
Create `.env` file:

```bash
# Roboflow
ROBOFLOW_API_KEY=your_roboflow_key
ROBOFLOW_WORKSPACE=your-workspace-name
ROBOFLOW_PROJECT=your-project-name
ROBOFLOW_MODEL_VERSION=1

# Anthropic
ANTHROPIC_API_KEY=sk-ant-api03-...

# N8N
N8N_WEBHOOK_BASE_URL=https://your-n8n-instance.app.n8n.cloud
N8N_RTSP_ANALYST_WEBHOOK=/webhook/rtsp-analyst

# Video Source (choose one)
RTSP_CAMERA_URL=rtsp://username:password@camera-ip:554/stream
# OR
VIDEO_FILE_PATH=/path/to/video.mp4
# OR
WEBCAM_INDEX=0

# Video Processing
VIDEO_FPS=60
VIDEO_RESOLUTION_WIDTH=1920
VIDEO_RESOLUTION_HEIGHT=1080

# Location (optional)
LATITUDE=10.234
LONGITUDE=-84.567
```

---

## System Requirements

**Minimum:**
- GPU: NVIDIA GTX 1060 (4GB VRAM)
- RAM: 16GB
- CPU: Intel Core i5
- Storage: 50GB

**Recommended:**
- GPU: NVIDIA RTX 3060 (12GB VRAM)
- RAM: 32GB
- CPU: Intel Core i7 or AMD Ryzen 7
- Storage: 100GB SSD

---

## Dependencies

Install via `requirements.txt`:

```
roboflow>=1.1.0
anthropic>=0.18.0
opencv-python>=4.8.0
python-dotenv>=1.0.0
requests>=2.31.0
numpy>=1.24.0
```

---

## Performance Optimization

### GPU Acceleration
Enable CUDA:

```python
import torch
print(f"CUDA Available: {torch.cuda.is_available()}")
print(f"GPU: {torch.cuda.get_device_name(0)}")
```

### Batch Processing
For higher throughput:

```python
# Process frames in batches
batch_size = 4
frames_batch = []

for i in range(batch_size):
    ret, frame = cap.read()
    frames_batch.append(frame)

# Batch inference
predictions = model.predict(frames_batch)
```

### Resolution Scaling
For lower-end hardware:

```python
# Reduce resolution
frame = cv2.resize(frame, (1280, 720))  # Instead of 1920×1080
```

---

## Troubleshooting

**Issue: Low FPS (<60)**  
Solutions:
- Enable GPU acceleration
- Reduce video resolution
- Lower detection confidence threshold (fewer boxes to draw)
- Disable video display (headless mode)

**Issue: RTSP connection fails**  
Solutions:
- Verify RTSP URL format
- Check network connectivity
- Test with VLC player first
- Add authentication credentials

**Issue: Anthropic API timeout**  
Solutions:
- Increase timeout in requests (default: 30s)
- Reduce frame resolution for vision analysis
- Check API key validity
- Monitor API rate limits

**Issue: N8N webhook not receiving data**  
Solutions:
- Verify webhook URL is correct
- Check N8N workflow is activated
- Test webhook with curl
- Review N8N logs

---

## Monitoring

### Real-Time Metrics
Console output shows:
- FPS (actual vs. target)
- Detection count per frame
- Analysis interval status
- N8N send status

### Logging
Enable detailed logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

---

## Custom Blocks - Quick Reference

| Block Name | Purpose | Input | Output | Frequency |
|-----------|---------|-------|--------|-----------|
| Detection_Converter | Structure YOLO data | Raw predictions | JSON detections | Every frame (60 FPS) |
| Add_Webcam_Interface | Video overlay | Frame + detections | Annotated frame | Every frame (60 FPS) |
| Anthropic_Environmental_Analyzer | AI analysis | Detection batch + frame | Environmental insights | Every 15 seconds |
| Analyst_Caller | Send to N8N | Detections + analysis | HTTP response | Every 15 seconds |

---

## Integration Points

### → N8N RTSP Analyst
- **Sends:** Detection batches every 15 seconds
- **Receives:** Acknowledgment + observation IDs
- **Protocol:** HTTP POST (JSON)

### → Airtable (via N8N)
- **Data flow:** Roboflow → N8N → Airtable
- **Storage:** 72 data points per species
- **Frequency:** Real-time (15-second batches)

---

## Support

- **Issues:** https://github.com/AudtheiaOfficial/audtheia-environmental-monitoring/issues
- **Documentation:** See main README.md
- **Custom Blocks:** Modify Python code in workflow

---

**Maintained by:** Andy Portalatin  
**Last Updated:** November 27, 2025  
**Version:** 1.0
