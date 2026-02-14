import os
import cv2
import numpy as np
import requests
import logging
from typing import List, Dict, Any
from ultralytics import YOLO
import pandas as pd
from collections import Counter

logger = logging.getLogger(__name__)

class CreativeIntelligenceService:
    """
    Module A: 'The Eye' (Vision AI)
    Analyzes ad creatives to extract visual elements (objects, colors, text density)
    and correlates them with performance data.
    """
    def __init__(self):
        self.model_path = os.getenv("YOLO_MODEL_PATH", "yolov8n.pt") # Default to nano model for speed
        try:
            logger.info(f"Loading YOLOv8 model from {self.model_path}...")
            self.model = YOLO(self.model_path)
        except Exception as e:
            logger.error(f"Failed to load YOLO model: {e}")
            self.model = None

    def analyze_creative_from_url(self, image_url: str) -> Dict[str, Any]:
        """
        Downloads image and runs full visual analysis.
        """
        if not self.model:
            return {"error": "Vision Model not initialized"}

        # 1. Download Image
        try:
            resp = requests.get(image_url, stream=True, timeout=10)
            if resp.status_code != 200:
                return {"error": f"Download failed: {resp.status_code}"}
            
            # Convert to numpy array for OpenCV
            arr = np.asarray(bytearray(resp.content), dtype=np.uint8)
            img = cv2.imdecode(arr, -1)
            
            if img is None:
                return {"error": "Invalid image data"}

        except Exception as e:
            return {"error": f"Image processing failed: {str(e)}"}

        # 2. Run Analysis
        return self._analyze_image_data(img)

    def _analyze_image_data(self, img: np.ndarray) -> Dict[str, Any]:
        """
        Internal: Runs Vision Logic on CV2 image.
        """
        results = {
            "objects": [],
            "colors": [],
            "brightness": 0.0,
            "text_density": 0.0,
            "face_count": 0
        }

        # A. Object Detection (YOLO)
        try:
            yolo_res = self.model(img, verbose=False)[0]
            
            detected_classes = []
            for box in yolo_res.boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                label = self.model.names[cls_id]
                
                if conf > 0.4: # Trusted threshold
                    detected_classes.append(label)
                    if label == "person":
                        results["face_count"] += 1
            
            results["objects"] = list(set(detected_classes)) # Unique tags
        except Exception as e:
            logger.error(f"YOLO detections failed: {e}")

        # B. Dominant Colors (K-Means simplified)
        try:
            # Resize for speed
            small_img = cv2.resize(img, (150, 150))
            pixels = np.float32(small_img.reshape(-1, 3))
            
            n_colors = 3
            criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
            _, labels, centers = cv2.kmeans(pixels, n_colors, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)
            
            dom_colors = []
            for color in centers:
                # BGR to Hex
                hex_color = "#{:02x}{:02x}{:02x}".format(int(color[2]), int(color[1]), int(color[0]))
                dom_colors.append(hex_color)
            
            results["colors"] = dom_colors
            
            # Avg Brightness
            hsv = cv2.cvtColor(small_img, cv2.COLOR_BGR2HSV)
            results["brightness"] = np.mean(hsv[:, :, 2]) / 255.0 # 0 to 1
            
        except Exception as e:
            logger.error(f"Color analysis failed: {e}")

        # C. Text Density Heuristic (Edge Detection)
        # High edge density often correlates with text overlay
        try:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            edges = cv2.Canny(gray, 100, 200)
            edge_pixels = np.count_nonzero(edges)
            total_pixels = img.shape[0] * img.shape[1]
            results["text_density"] = round(edge_pixels / total_pixels, 3)
        except Exception as e:
            logger.error(f"Texture/Text analysis failed: {e}")

        return results

    def correlate_performance(self, ads_data: List[Dict]) -> Dict[str, Any]:
        """
        Input: List of dicts with {'visual_tags': ['dog', 'outdoor'], 'roas': 3.5}
        Output: Aggregated performance stats per tag.
        """
        tag_stats = {}

        for ad in ads_data:
            roas = ad.get("roas", 0)
            tags = ad.get("visual_tags", [])
            
            for tag in tags:
                if tag not in tag_stats:
                    tag_stats[tag] = {"count": 0, "total_roas": 0.0}
                tag_stats[tag]["count"] += 1
                tag_stats[tag]["total_roas"] += roas
        
        # Calculate Avg
        final_report = []
        for tag, stats in tag_stats.items():
            if stats["count"] > 0:
                avg_roas = stats["total_roas"] / stats["count"]
                final_report.append({
                    "tag": tag,
                    "avg_roas": round(avg_roas, 2),
                    "count": stats["count"]
                })
        
        # Sort by ROAS
        final_report.sort(key=lambda x: x["avg_roas"], reverse=True)
        return {"tag_performance": final_report}

creative_intelligence_service = CreativeIntelligenceService()
