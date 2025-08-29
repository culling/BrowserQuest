# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BrowserQuest is an HTML5/JavaScript multiplayer game experiment that has been updated to use Socket.IO. It's a 2D browser-based multiplayer RPG with client-server architecture.

## Common Commands

### Development
```bash
npm install                    # Install dependencies
node server/js/main.js        # Start the game server
node client-server.js         # Start the client web server
```

### Building the Client
```bash
# Linux/Mac
cd bin
chmod +x build.sh
./build.sh                    # Creates optimized client-build/ directory

# Windows PowerShell
.\bin\build.ps1               # Creates optimized client-build/ directory
```

### Running Both Servers
```bash
# Windows batch
start-servers.bat

# Windows PowerShell  
.\start-servers.ps1

# Manual (any OS)
node server/js/main.js &      # Game server on port 8000
node client-server.js         # Client web server on port 3000
```

The build process uses RequireJS optimizer to create a production-ready client build. The build script removes unnecessary files and creates a deployable client-build/ directory.

### Web Server
- **Client web server**: `client-server.js` - Serves the built client files on port 3000
- **Game server**: `server/js/main.js` - Handles game logic and WebSocket connections on port 8000
- **Access**: Open http://localhost:3000 in your browser to play

## Architecture

### Client-Server Structure
- **Client** (`client/`): Browser-based game client using RequireJS modules
- **Server** (`server/`): Node.js game server with Socket.IO websockets  
- **Shared** (`shared/`): Common code shared between client and server

### Key Components

#### Client Architecture
- **Main entry**: `client/js/main.js` - Initializes app and game
- **Game engine**: `client/js/game.js` - Core game logic and state management
- **Renderer**: `client/js/renderer.js` - Canvas rendering system
- **Entities**: Characters, mobs, NPCs, items implemented as classes
- **Communication**: `client/js/gameclient.js` - Socket.IO client wrapper

#### Server Architecture  
- **Entry point**: `server/js/main.js` - Server initialization and world management
- **World server**: `server/js/worldserver.js` - Game world simulation
- **Entity system**: Characters, mobs, players, items with server-side logic
- **Communication**: `server/js/ws.js` - Socket.IO server wrapper

#### Shared Code
- **Game types**: `shared/js/gametypes.js` - Message types and constants used by both client and server

### Configuration
- Client config: `client/config/config_build.json` (copy from config_build.json-dist)
- Server config: `server/config_local.json` (copy from config_local.json-dist)

### Asset Organization
- Images organized in 3 resolution tiers: `client/img/1/`, `client/img/2/`, `client/img/3/`  
- Sprite definitions: `client/sprites/*.json`
- Map data: `client/maps/` and `server/maps/`
- Audio: `client/audio/sounds/`

### Development Notes
- Uses RequireJS for client-side module loading
- Socket.IO replaces the original WebSocket implementation
- Server supports multiple game worlds with configurable player limits
- Client supports mobile/tablet detection and touch controls