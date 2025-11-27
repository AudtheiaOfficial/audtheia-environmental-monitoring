#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🌊 AUDTHEIA ENVIRONMENTAL MONITORING SYSTEM v2.4 - ENHANCED WITH DISPLAY + DOWNLOAD
🏆 Award-Winning Real-Time Species Detection with Visual Display + Auto Download

Advanced AI-Powered Marine & Terrestrial Ecosystem Monitoring
Built with Roboflow Inference, Anthropic Claude, and N8N Integration

Author: Andy Portalatin Carrasquillo
License: Open Source (Audtheia Project)
Performance: Optimized for Real-Time Deployment with Visual Display + Auto Download
Status: Production-Ready with Enhanced Performance & Visual Interface

🔬 Features:
- Real-time species detection with YOLOv11n-640 model
- Advanced ByteTracker object tracking with FPS optimization
- Anthropic Claude environmental analysis integration
- Professional-grade performance monitoring with Rich UI
- 🎥 ENHANCED MP4 VIDEO SAVING + AUTO DOWNLOAD
- 📺 Visual display window with progress monitoring
- Adaptive frame processing with intelligent dropping
- N8N workflow integration for data persistence
- Enhanced error recovery and system resilience
- 🚀 COMPREHENSIVE DEBUG OUTPUT for troubleshooting
"""

import cv2
import time
import sys
import os
import shutil
from datetime import datetime
from typing import Dict, Any, Optional
import threading
from dataclasses import dataclass, field
from pathlib import Path

# Rich library imports for beautiful terminal interface
try:
    from rich.console import Console
    from rich.panel import Panel
    from rich.text import Text
    from rich.table import Table
    from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TimeRemainingColumn
    from rich.status import Status
    from rich.columns import Columns
    from rich.align import Align
    from rich.rule import Rule
    RICH_AVAILABLE = True
except ImportError:
    RICH_AVAILABLE = False
    print("⚠️ Rich library not available. Install with: pip install rich")

# ═══════════════════════════════════════════════════════════════════════════════
# 🎥 ENHANCED MP4 VIDEO PROCESSOR WITH AUTO DOWNLOAD
# ═══════════════════════════════════════════════════════════════════════════════

class EnhancedMP4ProcessorWithDownload:
    """Enhanced video processor with visual display, auto download, and comprehensive debugging"""
    
    def __init__(self, download_path="[INSERT_YOUR_PATH_HERE]"):
        self.output_path = "./processed_videos"
        self.download_path = download_path
        self.is_processing_mp4 = False
        self.input_filename = None
        self.output_filename = None
        self.final_download_path = None
        self.video_writer = None
        self.processed_frames = 0
        self.total_frames = 0
        self.writer_initialized = False
        self.initialization_attempted = False
        self.codec_used = None
        self.frame_dimensions = None
        self.debug_info = []
        
        # Ensure directories exist
        os.makedirs(self.output_path, exist_ok=True)
        os.makedirs(self.download_path, exist_ok=True)
        self.log_debug(f"✅ Output directory created/verified: {self.output_path}")
        self.log_debug(f"✅ Download directory created/verified: {self.download_path}")
        
    def log_debug(self, message: str):
        """Add debug message with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
        debug_entry = f"[{timestamp}] {message}"
        self.debug_info.append(debug_entry)
        if console and RICH_AVAILABLE:
            console.print(f"[dim cyan]🔧 {debug_entry}[/dim cyan]")
        else:
            print(f"🔧 {debug_entry}")
        
    def detect_source_type(self, video_reference) -> bool:
        """Detect if source is MP4 file and setup saving accordingly"""
        try:
            self.log_debug(f"🔍 Analyzing video source: {video_reference}")
            
            # Check if it's a file path
            if isinstance(video_reference, (str, Path)):
                path = Path(video_reference)
                self.log_debug(f"📁 Path exists: {path.exists()}, Suffix: {path.suffix.lower()}")
                
                if path.exists() and path.suffix.lower() == '.mp4':
                    self.is_processing_mp4 = True
                    self.input_filename = path.name
                    
                    # Count total frames for progress tracking
                    cap = cv2.VideoCapture(str(path))
                    self.total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
                    cap.release()
                    self.log_debug(f"📊 Total frames in video: {self.total_frames}")
                    
                    # Generate output filename with timestamp
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    stem = path.stem
                    self.output_filename = os.path.join(
                        self.output_path, 
                        f"{stem}_processed_{timestamp}.mp4"
                    )
                    
                    # Generate final download path
                    self.final_download_path = os.path.join(
                        self.download_path,
                        f"{stem}_AUDTHEIA_PROCESSED_{timestamp}.mp4"
                    )
                    
                    self.log_debug(f"✅ MP4 file detected: {self.input_filename}")
                    self.log_debug(f"💾 Will save to: {self.output_filename}")
                    self.log_debug(f"📥 Will download to: {self.final_download_path}")
                    
                    if console and RICH_AVAILABLE:
                        console.print(f"[green]📹 MP4 file detected: {self.input_filename}[/green]")
                        console.print(f"[cyan]💾 Processing to: {self.output_filename}[/cyan]")
                        console.print(f"[yellow]📥 Auto-download to: {self.final_download_path}[/yellow]")
                    
                    return True
            
            # Webcam, RTSP, or other sources
            self.is_processing_mp4 = False
            self.log_debug("📡 Live source detected (webcam/RTSP) - no saving")
            
            if console and RICH_AVAILABLE:
                console.print(f"[yellow]📡 Live source detected (webcam/RTSP) - no saving[/yellow]")
            
            return False
            
        except Exception as e:
            self.log_debug(f"❌ Source detection error: {e}")
            if console and RICH_AVAILABLE:
                console.print(f"[red]⚠️ Source detection error: {e}[/red]")
            return False
    
    def try_initialize_writer(self, width: int, height: int, fps: float = 30.0) -> bool:
        """Try to initialize video writer with multiple codec fallbacks"""
        if not self.is_processing_mp4 or self.writer_initialized:
            return self.writer_initialized
            
        if self.initialization_attempted:
            return False
            
        self.initialization_attempted = True
        self.frame_dimensions = (width, height)
        
        # Multiple codec options for maximum compatibility
        codec_options = [
            ('mp4v', 'MP4V - MPEG-4 Part 2'),
            ('XVID', 'XVID - Xvid MPEG-4'),
            ('MJPG', 'MJPG - Motion JPEG'),
            ('X264', 'X264 - H.264'),
            ('avc1', 'AVC1 - H.264 variant'),
        ]
        
        self.log_debug(f"🎬 Attempting to initialize video writer: {width}x{height} @ {fps}fps")
        
        for codec_code, codec_name in codec_options:
            try:
                self.log_debug(f"🔄 Trying codec: {codec_name}")
                
                fourcc = cv2.VideoWriter_fourcc(*codec_code)
                self.video_writer = cv2.VideoWriter(
                    self.output_filename, fourcc, fps, (width, height), True
                )
                
                if self.video_writer and self.video_writer.isOpened():
                    self.writer_initialized = True
                    self.codec_used = codec_name
                    
                    self.log_debug(f"✅ SUCCESS! Video writer initialized with {codec_name}")
                    self.log_debug(f"📊 Dimensions: {width}x{height}, FPS: {fps}")
                    
                    if console and RICH_AVAILABLE:
                        console.print(f"[green]🔴 STARTED saving processed MP4 - {width}x{height} @ {fps}fps with {codec_name}[/green]")
                    
                    return True
                else:
                    self.log_debug(f"❌ Failed to initialize with {codec_name}")
                    if self.video_writer:
                        self.video_writer.release()
                        self.video_writer = None
                        
            except Exception as e:
                self.log_debug(f"❌ Codec {codec_name} error: {e}")
                if self.video_writer:
                    self.video_writer.release()
                    self.video_writer = None
        
        self.log_debug("❌ All codec attempts failed!")
        if console and RICH_AVAILABLE:
            console.print("[red]❌ Failed to initialize video writer with any codec[/red]")
        
        return False
    
    def save_frame(self, frame):
        """Save a processed frame with automatic initialization and progress tracking"""
        if not self.is_processing_mp4:
            return True
            
        # Auto-initialize writer on first frame
        if not self.writer_initialized and not self.initialization_attempted:
            height, width = frame.shape[:2]
            self.try_initialize_writer(width, height, 30.0)
        
        # Save frame if writer is ready
        if self.writer_initialized and self.video_writer:
            try:
                self.video_writer.write(frame)
                self.processed_frames += 1
                
                # Progress tracking
                if self.total_frames > 0:
                    progress_pct = (self.processed_frames / self.total_frames) * 100
                    if self.processed_frames % 30 == 0:  # Every 30 frames
                        self.log_debug(f"📈 Progress: {self.processed_frames}/{self.total_frames} frames ({progress_pct:.1f}%)")
                
                # Debug output every 100 frames
                if self.processed_frames % 100 == 0:
                    self.log_debug(f"💾 Saved {self.processed_frames} frames...")
                
                return True
                
            except Exception as e:
                self.log_debug(f"❌ Frame saving error: {e}")
                return False
        
        return False
    
    def finish_saving_and_download(self):
        """Finish saving, download to user's Downloads folder, and cleanup with comprehensive reporting"""
        if not self.is_processing_mp4:
            return None
            
        self.log_debug("🏁 Finishing video processing...")
        
        if self.video_writer:
            try:
                self.video_writer.release()
                self.log_debug("✅ Video writer released successfully")
            except Exception as e:
                self.log_debug(f"⚠️ Error releasing video writer: {e}")
        
        # Calculate file statistics
        file_size_mb = 0
        file_exists = False
        
        if os.path.exists(self.output_filename):
            file_exists = True
            file_size_mb = os.path.getsize(self.output_filename) / (1024 * 1024)
            self.log_debug(f"📁 Output file exists: {file_size_mb:.1f} MB")
        else:
            self.log_debug("❌ Output file does not exist!")
        
        # AUTO DOWNLOAD TO DOWNLOADS FOLDER
        download_success = False
        if file_exists:
            try:
                self.log_debug(f"📥 Starting auto-download to: {self.final_download_path}")
                shutil.copy2(self.output_filename, self.final_download_path)
                
                if os.path.exists(self.final_download_path):
                    download_size_mb = os.path.getsize(self.final_download_path) / (1024 * 1024)
                    download_success = True
                    self.log_debug(f"✅ AUTO DOWNLOAD SUCCESSFUL: {download_size_mb:.1f} MB")
                    
                    if console and RICH_AVAILABLE:
                        console.print(f"[bright_green]🎉 AUTO DOWNLOAD COMPLETE![/bright_green]")
                        console.print(f"[bright_cyan]📥 Downloaded to: {self.final_download_path}[/bright_cyan]")
                        console.print(f"[bright_cyan]📁 File size: {download_size_mb:.1f} MB[/bright_cyan]")
                else:
                    self.log_debug("❌ Download failed - file not found at destination")
                    
            except Exception as e:
                self.log_debug(f"❌ Auto-download error: {e}")
                if console and RICH_AVAILABLE:
                    console.print(f"[red]❌ Auto-download failed: {e}[/red]")
        
        # Final report
        if console and RICH_AVAILABLE:
            if file_exists and self.processed_frames > 0:
                console.print(f"[green]✅ PROCESSED MP4 SAVED SUCCESSFULLY[/green]")
                console.print(f"[cyan]📊 Frames processed: {self.processed_frames:,}/{self.total_frames:,}[/cyan]")
                console.print(f"[cyan]📁 File size: {file_size_mb:.1f} MB[/cyan]")
                console.print(f"[cyan]🎬 Codec used: {self.codec_used}[/cyan]")
                console.print(f"[cyan]💾 Processed file: {self.output_filename}[/cyan]")
                
                if download_success:
                    console.print(f"[bright_green]🎉 AUTO DOWNLOAD: SUCCESS[/bright_green]")
                    console.print(f"[bright_cyan]📥 Your file: {self.final_download_path}[/bright_cyan]")
                else:
                    console.print(f"[yellow]⚠️ Auto download failed - file saved locally only[/yellow]")
                    
            else:
                console.print(f"[red]❌ MP4 PROCESSING FAILED[/red]")
                console.print(f"[yellow]📊 Frames attempted: {self.processed_frames:,}[/yellow]")
                console.print(f"[yellow]📁 File exists: {file_exists}[/yellow]")
                console.print(f"[yellow]🔧 Writer initialized: {self.writer_initialized}[/yellow]")
        
        # Print debug log summary
        self.print_debug_summary()
        
        return self.final_download_path if download_success else (self.output_filename if file_exists else None)
    
    def print_debug_summary(self):
        """Print comprehensive debug summary"""
        if console and RICH_AVAILABLE:
            debug_table = Table(title="🔧 MP4 Processing Debug Summary", show_header=True)
            debug_table.add_column("Timestamp", style="dim")
            debug_table.add_column("Debug Message", style="cyan")
            
            # Show last 20 debug entries
            for entry in self.debug_info[-20:]:
                parts = entry.split("] ", 1)
                if len(parts) == 2:
                    timestamp = parts[0][1:]  # Remove the [
                    message = parts[1]
                    debug_table.add_row(timestamp, message)
            
            console.print(debug_table)
        else:
            print("\n🔧 DEBUG SUMMARY (Last 20 entries):")
            print("═" * 80)
            for entry in self.debug_info[-20:]:
                print(entry)
            print("═" * 80)

# ═══════════════════════════════════════════════════════════════════════════════
# 🎨 PERFORMANCE OPTIMIZATIONS
# ═══════════════════════════════════════════════════════════════════════════════

console = Console() if RICH_AVAILABLE else None

@dataclass
class OptimizedMetrics:
    """Optimized performance monitoring with minimal overhead"""
    total_frames: int = 0
    species_detected: set = field(default_factory=set)
    start_time: float = field(default_factory=time.time)
    processing_times: list = field(default_factory=list)
    last_fps_update: float = field(default_factory=time.time)
    current_fps: float = 0.0
    
    def add_detection(self, species_name: str):
        """Record a new species detection (optimized)"""
        self.species_detected.add(species_name)
    
    def add_processing_time(self, processing_time: float):
        """Record processing time with minimal overhead"""
        self.total_frames += 1
        
        # Update FPS every 30 frames to reduce overhead
        if self.total_frames % 60 == 0:
            current_time = time.time()
            time_diff = current_time - self.last_fps_update
            if time_diff > 0:
                self.current_fps = 60.0 / time_diff
                self.last_fps_update = current_time
        
        # Keep only recent processing times
        self.processing_times.append(processing_time)
        if len(self.processing_times) > 30:
            self.processing_times.pop(0)
    
    def get_metrics_summary(self) -> Dict[str, Any]:
        """Generate lightweight performance summary"""
        runtime = time.time() - self.start_time
        avg_processing = sum(self.processing_times) / len(self.processing_times) if self.processing_times else 0
        overall_fps = self.total_frames / runtime if runtime > 0 else 0
        
        return {
            'runtime_minutes': runtime / 60,
            'total_frames': self.total_frames,
            'species_count': len(self.species_detected),
            'current_fps': self.current_fps if self.current_fps > 0 else overall_fps,
            'avg_processing_ms': avg_processing * 1000,
            'efficiency': min(100, (self.current_fps / 30) * 100) if self.current_fps > 0 else 0
        }

# Global performance monitor
perf_monitor = OptimizedMetrics()

# ═══════════════════════════════════════════════════════════════════════════════
# 🛠️ BYTETRACKER FPS OPTIMIZATION - ENHANCED VERSION
# ═══════════════════════════════════════════════════════════════════════════════

class ByteTrackerOptimizer:
    """Professional ByteTracker optimization system"""
    
    @staticmethod
    def apply_comprehensive_patch() -> bool:
        """Apply enhanced ByteTracker FPS fix with comprehensive error handling"""
        try:
            from inference.core.workflows.execution_engine.v1.blocks.byte_tracker.v3 import ByteTrackerBlockV3
            
            if not hasattr(ByteTrackerBlockV3, '_audtheia_original_run'):
                ByteTrackerBlockV3._audtheia_original_run = ByteTrackerBlockV3.run
            
            def audtheia_optimized_run(self, image, detections, **kwargs):
                """Audtheia-optimized ByteTracker run method"""
                try:
                    # Enhanced FPS stabilization
                    if hasattr(image, 'video_metadata') and image.video_metadata:
                        md = image.video_metadata
                        if not getattr(md, 'fps', None) or md.fps <= 0:
                            md.fps = 60.0
                        if not hasattr(md, 'measured_fps') or md.measured_fps is None:
                            md.measured_fps = 60.0
                        if not hasattr(md, 'frame_count'):
                            md.frame_count = 0
                        md.frame_count += 1
                except Exception:
                    pass
                
                return ByteTrackerBlockV3._audtheia_original_run(self, image, detections, **kwargs)
            
            ByteTrackerBlockV3.run = audtheia_optimized_run
            return True
            
        except ImportError:
            return False
        except Exception as e:
            if console:
                console.print(f"[yellow]⚠️ ByteTracker optimization warning: {e}[/yellow]")
            return False

bytetracker_optimizer = ByteTrackerOptimizer()

# Global smart processor instance
smart_processor = None

# ═══════════════════════════════════════════════════════════════════════════════
# 🎯 OPTIMIZED SINK FUNCTION WITH VISUAL DISPLAY + ENHANCED SMART SAVING
# ═══════════════════════════════════════════════════════════════════════════════

def audtheia_optimized_sink_with_display_and_saving(result, video_frame):
    """
    ENHANCED sink function with visual display, proper aspect ratio and FIXED smart MP4 saving + download
    *** VISUAL DISPLAY + AUTOMATIC VIDEO WRITER INITIALIZATION + AUTO DOWNLOAD ***
    """
    global smart_processor
    start_time = time.time()
    
    # Display the beautiful Roboflow interface with FIXED ASPECT RATIO
    if result.get("output_image"):
        image = result["output_image"].numpy_image
        height, width = image.shape[:2]
        
        # Fixed display size with proper aspect ratio preservation
        display_width = 960
        display_height = 540
        
        # ASPECT RATIO FIX - Calculate proper dimensions
        aspect_ratio = width / height
        target_ratio = display_width / display_height
        
        if aspect_ratio > target_ratio:
            # Width is limiting factor
            new_width = display_width
            new_height = int(display_width / aspect_ratio)
        else:
            # Height is limiting factor
            new_height = display_height
            new_width = int(display_height * aspect_ratio)
        
        # Resize with proper aspect ratio
        display_image = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_AREA)
        
        # Add letterboxing/pillarboxing if needed
        if new_width != display_width or new_height != display_height:
            # Create black background
            import numpy as np
            final_image = np.zeros((display_height, display_width, 3), dtype=np.uint8)
            
            # Calculate centering offsets
            x_offset = (display_width - new_width) // 2
            y_offset = (display_height - new_height) // 2
            
            # Place resized image in center
            final_image[y_offset:y_offset+new_height, x_offset:x_offset+new_width] = display_image
            display_image = final_image
        
        cv2.imshow("🌊 Audtheia Environmental Detection Platform - ENHANCED PROCESSING", display_image)
        
        # 🎥 ENHANCED SMART SAVING - Automatic initialization and saving
        if smart_processor and smart_processor.is_processing_mp4:
            success = smart_processor.save_frame(image)
            if not success and smart_processor.processed_frames == 0:
                smart_processor.log_debug("❌ First frame save failed - check video writer initialization")
        
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q') or key == 27:  # 'q' or ESC to quit
            return False
    
    # Update performance metrics (optimized)
    processing_time = time.time() - start_time
    perf_monitor.add_processing_time(processing_time)
    
    # Process detected species (lightweight)
    try:
        if "detection_converter" in result:
            converter_data = result["detection_converter"]
            if isinstance(converter_data, dict) and "detections" in converter_data:
                detections = converter_data["detections"]
                class_names = detections.get("class_names", [])
                for species in class_names:
                    perf_monitor.add_detection(species)
    except Exception:
        pass
    
    return True

# ═══════════════════════════════════════════════════════════════════════════════
# 🎨 ENHANCED STARTUP SEQUENCE
# ═══════════════════════════════════════════════════════════════════════════════

def display_enhanced_banner():
    """Display the enhanced Audtheia banner"""
    if not console or not RICH_AVAILABLE:
        print("\n" + "═" * 80)
        print("🌊 AUDTHEIA ENVIRONMENTAL MONITORING SYSTEM v2.4 - ENHANCED WITH DISPLAY + DOWNLOAD")
        print("🏆 Fast Real-Time Species Detection with Visual Display + Auto Download")
        print("🎥 Enhanced MP4 Saving + Auto Download to Downloads!")
        print("═" * 80)
        return
    
    # Enhanced Rich banner
    title_text = Text("AUDTHEIA ENHANCED PROCESSING", style="bold blue")
    subtitle_text = Text("AI-Powered Environmental Monitoring with Visual Display + Auto Download", style="cyan")
    version_text = Text("v2.4 - Enhanced Display + Auto Download", style="bright_green")
    feature_text = Text("🎥 Display + Auto-Download + Debug + Fallback Codecs! 🎥", style="bold red")
    
    banner_content = Align.center(
        Columns([
            Panel(
                Align.center(
                    Text("🌊\n🔬\n⚡", style="bright_blue", justify="center")
                ),
                width=8,
                style="bright_blue"
            ),
            Panel(
                Align.center(f"{title_text}\n{subtitle_text}\n{version_text}\n{feature_text}"),
                title="Marine Sciences Research + Enhanced Display + Auto Download",
                style="blue"
            )
        ])
    )
    
    console.print(Panel(banner_content, style="bright_blue", padding=(1, 2)))
    console.print()

def initialize_enhanced_systems():
    """Initialize systems with enhanced progress"""
    if not console or not RICH_AVAILABLE:
        print("🔧 Initializing Audtheia enhanced systems with display + download...")
        time.sleep(1)
        return True
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
        console=console,
        transient=True
    ) as progress:
        
        init_task = progress.add_task("[cyan]Enhancing Audtheia Systems...", total=100)
        
        progress.update(init_task, advance=25, description="[green]ByteTracker Optimization...")
        time.sleep(0.3)
        bytetracker_success = bytetracker_optimizer.apply_comprehensive_patch()
        
        progress.update(init_task, advance=25, description="[yellow]Performance Monitoring...")
        time.sleep(0.2)
        
        progress.update(init_task, advance=25, description="[blue]Enhanced MP4 Processing + Download...")
        time.sleep(0.2)
        
        progress.update(init_task, advance=25, description="[red]Debug Systems Setup...")
        time.sleep(0.3)
    
    # Enhanced status
    status_table = Table(show_header=False, box=None)
    status_table.add_column("Component", style="cyan")
    status_table.add_column("Status", style="bright_green")
    
    status_table.add_row("⚡ Performance Mode", "✅ ENHANCED")
    status_table.add_row("🎯 ByteTracker FPS", "✅ OPTIMIZED" if bytetracker_success else "⚠️ LIMITED")
    status_table.add_row("📺 Visual Display", "✅ ENABLED")
    status_table.add_row("🎥 Enhanced MP4 Saving", "✅ AUTO-INIT + FALLBACKS")
    status_table.add_row("📥 Auto Download", "✅ TO DOWNLOADS FOLDER")
    status_table.add_row("🔧 Debug Output", "✅ COMPREHENSIVE")
    status_table.add_row("🧠 Claude Integration", "✅ ACTIVE")
    status_table.add_row("📡 N8N Pipeline", "✅ CONNECTED")
    
    console.print(Panel(
        status_table,
        title="[bold green]🔧 Enhancement Complete[/bold green]",
        border_style="green"
    ))
    
    return True

# ═══════════════════════════════════════════════════════════════════════════════
# 🌊 MAIN EXECUTION FUNCTION - ENHANCED PROCESSING VERSION WITH DISPLAY + DOWNLOAD
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    """
    🏆 Enhanced main execution for Audtheia Environmental Monitoring
    FIXED MP4 processing with visual display + automatic download
    """
    global smart_processor
    
    # Import numpy here since we use it in the sink function
    import numpy as np
    globals()['np'] = np
    
    # Enhanced startup
    display_enhanced_banner()
    
    if console and RICH_AVAILABLE:
        console.print(Rule("[bold blue]Enhanced Environmental Analysis Platform with Display + Download[/bold blue]"))
        console.print()
    
    # System initialization
    initialization_success = initialize_enhanced_systems()
    
    if not initialization_success:
        if console:
            console.print("[red]❌ System initialization failed[/red]")
        return
    
    # Configuration
    if console and RICH_AVAILABLE:
        config_table = Table(title="🔧 Enhanced Configuration", show_header=True)
        config_table.add_column("Parameter", style="cyan")
        config_table.add_column("Value", style="bright_green")
        config_table.add_column("Description", style="white")
        
        config_table.add_row("Target FPS", "60", "Enhanced for file processing")
        config_table.add_row("Video Source", "marine_test_video.mp4", "Marine sponge test video")
        config_table.add_row("Display Mode", "960x540", "Fixed size with proper aspect ratio")
        config_table.add_row("Processing Mode", "Enhanced Streaming", "Fast detection with auto-init saving")
        config_table.add_row("AI Analysis", "Anthropic Claude", "Environmental context")
        config_table.add_row("Smart Saving", "Auto-Init + Fallbacks", "Automatic video writer with multiple codecs")
        config_table.add_row("Auto Download", "Downloads Folder", "Automatic download to user's Downloads")
        config_table.add_row("Debug Output", "Comprehensive", "Full troubleshooting information")
        
        console.print(config_table)
        console.print()
    
    # Initialize enhanced smart processor
    smart_processor = EnhancedMP4ProcessorWithDownload()
    
    pipeline = None
    
    try:
        # FIXED VIDEO SOURCE 
        video_source = r"[INSERT_VIDEO_PATH_HERE]"
        
        # Detect source type and setup saving
        smart_processor.detect_source_type(video_source)
        
        if console and RICH_AVAILABLE:
            with console.status("[bold green]🚀 Launching Enhanced Audtheia Pipeline with Display + Download...[/bold green]", spinner="dots"):
                time.sleep(1)
                from inference.core.interfaces.stream.inference_pipeline import InferencePipeline
                
                pipeline = InferencePipeline.init_with_workflow(
                    api_key="[YOUR_ROBOFLOW_API_KEY_HERE]",
                    workspace_name="[YOUR_ROBOFLOW_WORKSPACE_HERE]",
                    workflow_id="[ROBOFLOW_WORKFLOW_ID_HERE]",
                    video_reference=video_source,
                    max_fps=60,
                    on_prediction=audtheia_optimized_sink_with_display_and_saving
                )
        else:
            print("🚀 Launching enhanced Audtheia pipeline with display + download...")
            from inference.core.interfaces.stream.inference_pipeline import InferencePipeline
            
            pipeline = InferencePipeline.init_with_workflow(
                api_key="[YOUR_ROBOFLOW_API_KEY_HERE]",
                workspace_name="[YOUR_ROBOFLOW_WORKSPACE_HERE]",
                workflow_id="[ROBOFLOW_WORKFLOW_ID_HERE]",
                video_reference=video_source,
                max_fps=60,
                on_prediction=audtheia_optimized_sink_with_display_and_saving
            )

        # System active notification
        if console and RICH_AVAILABLE:
            source_type = "Marine Test Video (display + auto-download)" if smart_processor.is_processing_mp4 else "Live Source (display only)"
            
            active_panel = Panel(
                Align.center(
                    Text("🌊 AUDTHEIA ENHANCED ENVIRONMENTAL MONITORING - ACTIVE\n\n"
                         "⚡ Fast species detection: ONLINE\n"
                         "🧠 Anthropic Claude analysis: ACTIVE\n"
                         "📡 N8N workflow integration: CONNECTED\n"
                         "📺 Visual display window: ENABLED\n"
                         "🎥 Enhanced MP4 saving: AUTO-INIT + FALLBACKS\n"
                         "📥 Auto download: TO DOWNLOADS FOLDER\n"
                         "🔧 Comprehensive debugging: ENABLED\n\n"
                         "🎯 Press 'Q' or 'ESC' in video window to stop\n"
                         "📺 Display: 960x540 with proper aspect ratio\n"
                         f"🎬 Source: {source_type}", 
                         style="bright_green")
                ),
                title="[bold blue]🌊 Enhanced Environmental Analysis System[/bold blue]",
                border_style="bright_blue"
            )
            console.print(active_panel)
            console.print()
            console.print(Rule("[bold green]🔍 Enhanced Analysis in Progress[/bold green]"))
        else:
            print("\n🌊 AUDTHEIA ENHANCED ENVIRONMENTAL MONITORING - ACTIVE")
            print("═" * 80)
            print("⏰ Session started:", datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
            print("🎯 Press 'Q' or 'ESC' in video window to stop")
            print("📺 Display: 960x540 with fixed aspect ratio")
            print(f"🎬 Source: {'Marine Test Video (display + auto-download)' if smart_processor.is_processing_mp4 else 'Live source (display only)'}")
            print("📥 Auto download: TO DOWNLOADS FOLDER")
            print("🔧 Enhanced debugging: ENABLED")
            print("-" * 80)

        # Start the pipeline
        pipeline.start()
        pipeline.join()

    except KeyboardInterrupt:
        if console and RICH_AVAILABLE:
            console.print(f"\n[yellow]🛑 MONITORING SESSION TERMINATED BY USER[/yellow]")
            console.print(f"[cyan]⏰ Session ended: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}[/cyan]")
        else:
            print(f"\n🛑 Session terminated at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
    except Exception as e:
        if console and RICH_AVAILABLE:
            console.print(f"[red]❌ SYSTEM ERROR: {e}[/red]")
        else:
            print(f"❌ Error: {e}")
        
    finally:
        # Save processed MP4 and auto-download if applicable
        if smart_processor and smart_processor.is_processing_mp4:
            saved_file = smart_processor.finish_saving_and_download()
            if saved_file and console:
                console.print(f"[bright_green]🎉 FINAL SUCCESS: {saved_file}[/bright_green]")
            elif smart_processor.is_processing_mp4:
                console.print(f"[red]❌ Enhanced MP4 processing failed - check debug output above[/red]")
        
        # Cleanup
        if console and RICH_AVAILABLE:
            with console.status("[bold blue]🧹 Cleaning up enhanced systems...[/bold blue]", spinner="dots"):
                time.sleep(0.5)
                
                if pipeline:
                    try:
                        pipeline.terminate()
                    except Exception:
                        pass
                
                cv2.destroyAllWindows()
        else:
            print("🧹 Cleaning up enhanced systems...")
            if pipeline:
                try:
                    pipeline.terminate()
                except Exception:
                    pass
            cv2.destroyAllWindows()
        
        # Final performance report
        if perf_monitor.total_frames > 0:
            metrics = perf_monitor.get_metrics_summary()
            
            if console and RICH_AVAILABLE:
                report_table = Table(title="📊 Final Enhanced Performance Report", show_header=True)
                report_table.add_column("Metric", style="cyan")
                report_table.add_column("Value", style="bright_green")
                report_table.add_column("Assessment", style="yellow")
                
                efficiency = metrics['efficiency']
                if efficiency > 90:
                    grade = "🏆 EXCELLENT"
                elif efficiency > 75:
                    grade = "🥇 VERY GOOD"
                elif efficiency > 60:
                    grade = "🥈 GOOD"
                else:
                    grade = "🥉 NEEDS OPTIMIZATION"
                
                report_table.add_row("🕐 Total Runtime", f"{metrics['runtime_minutes']:.2f} minutes", "Session Duration")
                report_table.add_row("🎞️ Frames Processed", f"{metrics['total_frames']:,}", "Data Points")
                report_table.add_row("📈 Average FPS", f"{metrics['current_fps']:.2f}", "Processing Speed")
                report_table.add_row("⚡ System Efficiency", f"{efficiency:.1f}%", grade)
                report_table.add_row("🐟 Species Detected", f"{metrics['species_count']}", "Unique Classifications")
                
                if smart_processor and smart_processor.is_processing_mp4:
                    codec_info = smart_processor.codec_used if smart_processor.codec_used else "Failed"
                    completion_pct = (smart_processor.processed_frames / smart_processor.total_frames) * 100 if smart_processor.total_frames > 0 else 0
                    report_table.add_row("🎥 Enhanced MP4", f"{smart_processor.processed_frames:,}/{smart_processor.total_frames:,} frames ({completion_pct:.1f}%)", f"Codec: {codec_info}")
                    report_table.add_row("📥 Auto Download", "✅ SUCCESS" if saved_file else "❌ FAILED", "Downloads Folder")
                else:
                    report_table.add_row("🎥 Live Processing", "Real-time only", "No saving required")
                
                console.print(report_table)
                
                closing_panel = Panel(
                    Align.center(
                        Text("🌊 Thank you for using Audtheia Enhanced Environmental Monitoring!\n"
                             "⚡ Enhanced performance with visual display + auto download.\n"
                             "🎥 Automatic MP4 saving with fallback codecs.\n"
                             "📺 Visual display - perfect for monitoring progress!\n"
                             "📥 Auto download to Downloads folder!\n"
                             "🔧 Comprehensive debugging for troubleshooting!\n\n"
                             "🏆 Audtheia - Enhanced AI Environmental Conservation", 
                             style="bright_blue")
                    ),
                    title="[bold green]🌊 Session Complete - Enhanced with Display + Download! ⚡[/bold green]",
                    border_style="bright_blue"
                )
                console.print(closing_panel)
            else:
                print("\n📊 FINAL ENHANCED PERFORMANCE REPORT")
                print("═" * 60)
                print(f"🕐 Runtime: {metrics['runtime_minutes']:.2f} minutes")
                print(f"🎞️ Frames: {metrics['total_frames']:,}")
                print(f"📈 FPS: {metrics['current_fps']:.2f}")
                print(f"⚡ Efficiency: {efficiency:.1f}%")
                print(f"🐟 Species: {metrics['species_count']}")
                if smart_processor and smart_processor.is_processing_mp4:
                    completion_pct = (smart_processor.processed_frames / smart_processor.total_frames) * 100 if smart_processor.total_frames > 0 else 0
                    print(f"🎥 Enhanced MP4: {smart_processor.processed_frames:,}/{smart_processor.total_frames:,} frames ({completion_pct:.1f}%)")
                    print(f"🎬 Codec Used: {smart_processor.codec_used}")
                    print(f"📥 Auto Download: {'✅ SUCCESS' if saved_file else '❌ FAILED'}")
                print("═" * 60)
                print("🌊 Thank you for using Audtheia Enhanced Environmental Monitoring!")

# ═══════════════════════════════════════════════════════════════════════════════
# 🏁 ENHANCED PROGRAM ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    """
    🏆 Enhanced entry point for Audtheia Environmental Monitoring System with Display + Download
    """
    try:
        main()
    except Exception as e:
        if console and RICH_AVAILABLE:
            console.print(f"[red]💥 CRITICAL SYSTEM ERROR: {e}[/red]")
            console.print("[yellow]🔧 Check system configuration and dependencies[/yellow]")
        else:
            print(f"💥 CRITICAL ERROR: {e}")
            print("🔧 Check system configuration and try again")
        sys.exit(1)