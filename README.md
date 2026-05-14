# Talkmandu

A real-time video conferencing application built with WebRTC, Socket.io, React, and Node.js.

## Features

### Meeting Rooms
- **Create instant rooms** - Generate unique room IDs and share them with others
- **Join existing rooms** - Enter a room ID to join a meeting
- **Multi-participant support** - Up to 4 participants in a mesh topology
- **Real-time chat** - Send and receive text messages during meetings
- **Media controls** - Toggle microphone and camera on/off

### Random 1-to-1 Matching
- **Anonymous matching** - Connect with random strangers for instant video calls
- **Skip anytime** - Move to the next match with a single click
- **Queue system** - Smart matching using Redis-backed queue

### User Experience
- **Responsive design** - Works on desktop and mobile devices
- **Display name** - Persistent local storage of your display name
- **Intuitive UI** - Clean, modern interface with Tailwind CSS
- **Copy room ID** - One-click copy functionality for easy sharing

## Tech Stack

### Client
- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Socket.io Client** - Real-time communication
- **Tailwind CSS 4** - Styling
- **WebRTC** - Peer-to-peer video/audio

### Server
- **Express** - Web framework
- **Socket.io** - WebSocket server
- **Redis** - State management (room state, chat history, matching queue)
- **Express Rate Limit** - Rate limiting protection

## Project Structure

```
Talkmandu/
├── Client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Route pages
│   │   ├── utils/          # Utility functions
│   │   ├── socket.js       # Socket connection
│   │   ├── App.jsx         # Main app component
│   │   └── index.css       # Global styles
│   └── index.html          # Entry HTML
│
└── Server/                 # Node.js backend
    ├── src/
    │   ├── configs/        # Configuration
    │   ├── services/       # Redis service
    │   ├── socket/         # Socket handlers
    │   └── index.js        # Server entry point
    └── package.json
```

## Getting Started

### Prerequisites
- Node.js 18+
- Redis server (for state management)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Talkmandu
```

2. Install server dependencies:
```bash
cd server
npm install
```

3. Install client dependencies:
```bash
cd ../client
npm install
```

### Environment Setup

Create a `.env` file in the Server directory:
```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
REDIS_URL=redis://localhost:6379
```

Create a `.env` file in the Client directory:
```env
VITE_BACKEND_URL=http://localhost:5000
```

### Running the Application

1. Start Redis (if not running):
```bash
redis-server
```

2. Start the server:
```bash
cd server
npm run dev
```

3. Start the client:
```bash
cd client
npm run dev
```

4. Open `http://localhost:5173` in your browser.

## Usage

### Create a Meeting
1. Enter your display name on the landing page
2. Click "Create new meeting"
3. Share the room ID with others

### Join a Meeting
1. Enter your display name on the landing page
2. Enter the room ID in the "Join a meeting" section
3. Click "Join meeting"

### Random Chat
1. Enter your display name on the landing page
2. Click "Start random chat"
3. Wait for a match to be found
4. Use "Next" to find a new person or "Stop" to exit

## API Events

### Meeting Events
- `meeting:join` - Join a room
- `meeting:leave` - Leave a room
- `meeting:peers` - Get existing peers
- `meeting:peer-joined` - New peer joined
- `meeting:peer-left` - Peer left
- `meeting:offer` / `meeting:answer` / `meeting:ice` - WebRTC signaling
- `meeting:chat` - Chat messages
- `meeting:cam` - Camera state

### Random Events
- `random:start` - Start matching
- `random:stop` - Stop matching
- `random:next` - Find next match
- `random:matched` - Match found
- `random:waiting` - Waiting for match
- `random:partner-left` - Partner disconnected

## License

ISC