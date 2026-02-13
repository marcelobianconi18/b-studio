
import requests
import json
import time

URL = "http://localhost:8001/api/posts/schedule"

def test_schedule():
    print("🚀 Testing Post Scheduling...")
    
    payload = {
        "message": "Hello from B-Studio Automation! 🤖",
        # "image_url": "https://via.placeholder.com/150", # Optional
        # "scheduled_time": "2024-12-31T23:59:59" # Optional (future date tests scheduling)
    }
    
    try:
        response = requests.post(URL, json=payload)
        response.raise_for_status()
        data = response.json()
        print(f"✅ Success! Response: {json.dumps(data, indent=2)}")
        
        if data['status'] == 'queued':
            print("Create task ID:", data['id'])
            print("Check worker logs to see execution.")
            
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to API. Is it running on port 8001?")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    # Wait a bit for server to start if ran immediately
    # time.sleep(2) 
    test_schedule()
