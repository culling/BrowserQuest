# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BrowserQuest is an HTML5/JavaScript multiplayer game experiment that has been updated to use Socket.IO. It's a 2D browser-based multiplayer RPG with client-server architecture.

## Common Commands

### Development
```bash
npm install                    # Install dependencies
npm run dev                    # Start both servers concurrently
npm run start-server           # Start game server only (port 8000)
npm run start-client           # Start client web server only (port 3000)
npm run stop                   # Stop both servers
```

### Building the Client
```bash
# Cross-platform (recommended)
npm run build                 # Creates optimized client-build/ directory

# Manual builds
# Linux/Mac
cd bin
chmod +x build.sh
./build.sh                    # Creates optimized client-build/ directory

# Windows PowerShell
.\bin\build.ps1               # Creates optimized client-build/ directory
```

### Exporting Maps
```bash
# Export both client and server maps (recommended)
npm run map:export

# Export specific maps only
npm run map:export-client     # Client map only
npm run map:export-server     # Server map only

# Direct script usage
cd tools/maps
node export-map.js            # Both maps
node export-map.js --skip-server    # Client only  
node export-map.js --skip-client    # Server only
export-map.bat                # Windows batch file
```

### Running Both Servers
```bash
# Recommended (cross-platform)
npm run dev                   # Start both servers concurrently
npm run stop                  # Stop both servers

# Alternative methods
npm run start-both            # Same as npm run dev
start-servers.bat             # Windows batch (legacy)
.\start-servers.ps1           # Windows PowerShell (legacy)

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
- Use `npm run stop` to stop both servers, or manually: `Get-NetTCPConnection -LocalPort 8000,3000 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }`
- Always remember this is a windows computer and try powershell commands first