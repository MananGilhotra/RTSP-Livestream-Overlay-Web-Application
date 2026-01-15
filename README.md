# RTSP Livestream Overlay Web Application

A full-stack web application that displays an RTSP/webcam video stream with interactive, draggable, and resizable overlay elements (text/images) that persist to MongoDB.

## 📁 Project Structure

```
RTSP Livestream Overlay/
├── backend/
│   ├── app.py                 # Flask application (video stream + API)
│   └── requirements.txt       # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Overlay.jsx    # Draggable/resizable overlay
│   │   │   └── ControlPanel.jsx
│   │   ├── services/
│   │   │   └── api.js         # Backend API calls
│   │   ├── App.jsx            # Main application
│   │   └── App.css            # Styling
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- **Python 3.8+**
- **Node.js 18+**
- **MongoDB** (running locally on port 27017)

### 1. Start MongoDB

```bash
# If using Homebrew on macOS
brew services start mongodb-community

# Or start manually
mongod --dbpath /path/to/your/db
```

### 2. Start the Backend

```bash
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python app.py
```

The backend will start at **http://localhost:5001**

### 3. Start the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```

The frontend will start at **http://localhost:5173**

## 🎯 Features

- **Live Video Stream**: Displays RTSP or webcam feed via MJPEG
- **Text Overlays**: Add customizable text overlays on the video
- **Image Overlays**: Add images via URL on the video
- **Drag & Drop**: Move overlays anywhere on the video
- **Resize**: Resize overlays by dragging the corner handle
- **Persistence**: All overlay positions and sizes are saved to MongoDB

## 🔧 Configuration

### Video Source

By default, the backend uses your webcam (index `0`). To use an RTSP stream, set the `VIDEO_SOURCE` environment variable:

```bash
# In backend directory, create .env file
echo "VIDEO_SOURCE=rtsp://your-camera-url" > .env
```

### MongoDB URI

Default: `mongodb://localhost:27017/rtsp_overlay`

To use a different MongoDB instance:

```bash
echo "MONGO_URI=mongodb://your-mongo-url" >> .env
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/video_feed` | MJPEG video stream |
| GET | `/api/overlays` | Get all overlays |
| POST | `/api/overlays` | Create new overlay |
| PUT | `/api/overlays/:id` | Update overlay |
| DELETE | `/api/overlays/:id` | Delete overlay |

### Overlay Schema

```json
{
  "_id": "ObjectId",
  "type": "text | image",
  "content": "string",
  "x": 0,
  "y": 0,
  "width": 200,
  "height": 100
}
```

## 🧪 Testing

### Test Video Stream
Open http://localhost:5001/video_feed in your browser - you should see the webcam feed.

### Test API with curl

```bash
# Create overlay
curl -X POST http://localhost:5001/api/overlays \
  -H "Content-Type: application/json" \
  -d '{"type":"text","content":"Hello World","x":100,"y":100,"width":200,"height":50}'

# Get all overlays
curl http://localhost:5001/api/overlays

# Update overlay (replace <id> with actual ID)
curl -X PUT http://localhost:5001/api/overlays/<id> \
  -H "Content-Type: application/json" \
  -d '{"x":200,"y":200}'

# Delete overlay
curl -X DELETE http://localhost:5001/api/overlays/<id>
```

## 🛠 Tech Stack

- **Backend**: Python, Flask, OpenCV, Flask-PyMongo
- **Frontend**: React (Vite), react-draggable, react-resizable
- **Database**: MongoDB
