# BrowserQuest Map System

This document explains how maps are created, edited, and processed in BrowserQuest.

## Overview

BrowserQuest uses a dual-map system with separate client and server map files generated from a single TMX source file using the Tiled Map Editor. The client map handles visual rendering and basic collision detection, while the server map manages entity spawning, gameplay areas, and server-side collision logic.

## Map Creation & Editing Workflow

### Primary Tool: Tiled Map Editor

- **Editor**: [Tiled Map Editor](http://www.mapeditor.org/)
- **Source file**: `tools/maps/tmx/map.tmx` (TMX format)
- **Map dimensions**: 172×314 tiles (16×16 pixels per tile)
- **Tileset**: `client/img/1/tilesheet.png`

### Export Process

1. **Edit the map**: Open `tools/maps/tmx/map.tmx` in Tiled Map Editor
2. **Export client map**: 
   ```bash
   cd tools/maps
   ./export.py client
   ```
3. **Export server map**:
   ```bash
   cd tools/maps  
   ./export.py server
   ```

**Note**: Both commands must be run to generate complete map data. Server map changes require a server restart.

## Map File Structure

### Client Maps (`client/maps/`)

- **`world_client.json`** - Used for Ajax loading
- **`world_client.js`** - Used for Web Worker loading

**Contains:**
- Terrain tile layers
- Collision cells
- Door/transition points
- Music areas
- Visual rendering data
- Animation data

### Server Map (`server/maps/`)

- **`world_server.json`** - Server-side map data

**Contains:**
- Static entity spawn points
- Mob roaming areas
- Chest locations and areas
- Collision data for server-side validation
- Checkpoint locations

## Map Data Properties

### Tile Properties (in TMX)

Properties are set in Tiled for individual tiles:

- **`c` property**: Collision tiles (blocks player movement)
- **`v` property**: Visual-only tiles  
- **`length` property**: Animation frame count for animated tiles

### Generated Map Structure

**Common Properties:**
```json
{
  "width": 172,
  "height": 314, 
  "tilesize": 16,
  "collisions": [...],
  "doors": [...],
  "checkpoints": [...]
}
```

**Client-Only Properties:**
```json
{
  "data": [...],           // Base terrain layer
  "high": [...],           // High/overlay layer  
  "animated": {...},       // Animated tile definitions
  "blocking": [...],       // Client-side collision grid
  "plateau": [...],        // Elevation data
  "musicAreas": [...]      // Background music zones
}
```

**Server-Only Properties:**
```json
{
  "roamingAreas": [...],   // Mob spawn/movement areas
  "chestAreas": [...],     // Treasure chest locations
  "staticChests": [...],   // Fixed chest spawns
  "staticEntities": {...}  // NPCs and static objects
}
```

## Export Tool Chain

The map export process involves several tools in sequence:

### 1. tmx2json.py
- Converts TMX file to temporary JSON format
- Handles Tiled-specific data structures

### 2. processmap.js  
- Processes JSON into BrowserQuest game format
- Separates client vs server data
- Generates collision grids and optimized data structures
- Located at: `tools/maps/processmap.js`

### 3. exportmap.js
- Saves final map files to appropriate directories
- Creates both `.json` and `.js` versions for client

## Prerequisites & Setup

**Required Software:**
- Python (for tmx2json.py)
- Node.js (for processmap.js and exportmap.js)
- Tiled Map Editor

**Python Dependencies:**
```bash
pip install lxml
```

**Optional:**
- Growl + growlnotify (OSX only, for export notifications)

## Map Loading in Game

### Client-Side Loading

The client uses different loading methods based on browser capabilities:

```javascript
// Web Worker loading (preferred)
var worker = new Worker('js/mapworker.js');
// Loads: maps/world_client.js

// Ajax loading (fallback)
$.get("maps/world_client.json", function(data) {
  // Process map data
});
```

### Server-Side Loading

```javascript
// Server loads map synchronously at startup
var map = new Map("maps/world_server.json");
```

## Known Issues & Limitations

### Current Bugs
- **Empty layer requirement**: Must keep an empty layer at the bottom of the Tiled layer stack, or the first terrain layer will be missing
- **Performance**: Export process can take several minutes for large maps
- **Platform**: Tool was designed for OSX; Windows users may need modifications

### Performance Considerations
- Client map files can be very large (400KB+)
- Web Worker loading improves performance on desktop
- Mobile/tablet devices use Ajax loading instead

## File Locations

```
BrowserQuest/
├── tools/maps/
│   ├── README.md           # Original documentation
│   ├── export.py           # Main export script
│   ├── tmx2json.py         # TMX to JSON converter  
│   ├── processmap.js       # Map data processor
│   ├── exportmap.js        # Final export handler
│   └── tmx/
│       ├── map.tmx         # Source map file
│       └── mobset.png      # Additional tileset
├── client/maps/
│   ├── world_client.json   # Client map (Ajax)
│   └── world_client.js     # Client map (Worker)
├── server/maps/
│   └── world_server.json   # Server map
├── client/js/
│   ├── map.js              # Client map loader
│   └── mapworker.js        # Web Worker map processor
└── server/js/
    └── map.js              # Server map loader
```

## Player Spawn System

### Overview

BrowserQuest uses a checkpoint-based spawn system that determines where players appear when they first join the game or respawn after death. The system distinguishes between initial spawn locations (starting areas) and respawn checkpoints.

### Spawn Mechanics

#### Initial Spawn (New Players)
- **Function**: `getRandomStartingPosition()` in `server/js/map.js:202`
- **Selection**: Randomly chooses from designated starting areas
- **Areas**: Checkpoints marked with `s: 1` in the server map data
- **Location**: Starting areas (checkpoints 1-7) concentrated in southern map region

#### Respawn (After Death)
- **Function**: `lastCheckpoint.getRandomPosition()` in `server/js/worldserver.js:55` 
- **Logic**: Players respawn at their most recently activated checkpoint
- **Fallback**: If no checkpoint activated, uses starting areas
- **Activation**: Players activate checkpoints by sending `CHECK` message (`player.js:216`)

### Checkpoint Data Structure

Checkpoints are defined in `server/maps/world_server.json` with the following properties:

```json
{
  "id": 1,        // Unique checkpoint identifier
  "x": 14,        // X coordinate (top-left)
  "y": 210,       // Y coordinate (top-left) 
  "w": 9,         // Width of spawn area
  "h": 2,         // Height of spawn area
  "s": 1          // Starting area flag (1 = starting area, 0 = regular checkpoint)
}
```

### Starting Areas (s: 1)

**Checkpoint 1**: (150, 138) - 8×6 area  - Programmers room

### Regular Checkpoints (s: 0)

**Checkpoints 8-24**: Respawn points distributed throughout the map
- Located at various strategic points across all map regions
- Y coordinates range from 48-257 (full map coverage)
- Activated when players reach them during gameplay

### Position Generation

**Algorithm** (`server/js/checkpoint.js:16`):
```javascript
pos.x = this.x + Utils.randomInt(0, this.width - 1);
pos.y = this.y + Utils.randomInt(0, this.height - 1);
```

Each checkpoint defines a rectangular area where players spawn at a random position within those bounds.

### Spawn Flow Summary

1. **New player joins** → `updatePosition()` called → Random starting area selected (checkpoints 1-7)
2. **Player explores** → Encounters checkpoint → Sends `CHECK` message → `lastCheckpoint` updated
3. **Player dies/respawns** → Uses `lastCheckpoint.getRandomPosition()` or fallback to starting areas
4. **Position calculated** → Random point within checkpoint's rectangular bounds

### Map Regions

**Starting Zone** (Y: 208-233): Southern region with 7 starting areas, likely representing a starting town or safe zone  
**Northern Region** (Y: 48-118): 6 checkpoints including advanced areas  
**Central Region** (Y: 133-184): 4 checkpoints for mid-game progression  
**Southern Exploration** (Y: 250-257): 4 checkpoints for extended gameplay areas

### Implementation Files

- **`server/js/checkpoint.js`**: Checkpoint class and position generation
- **`server/js/map.js`**: Map loading and checkpoint initialization  
- **`server/js/player.js`**: Player spawn logic and checkpoint activation
- **`server/js/worldserver.js`**: Player connection and spawn coordination
- **`server/maps/world_server.json`**: Checkpoint coordinate data

## Editing Workflow Tips

1. **Backup first**: Always backup `map.tmx` before major changes
2. **Test both exports**: Run both client and server exports after changes
3. **Server restart**: Remember to restart the server after server map changes
4. **Layer organization**: Keep the required empty layer at the bottom
5. **Performance**: Large changes may significantly increase export time

## Contributing

The map tools could benefit from improvements:

- Remove hard-coded filenames for easier map switching
- Fix the empty layer requirement bug
- Add Windows-specific documentation
- Document BrowserQuest-specific object properties in Tiled
- Replace slow tmx2json.py step with Tiled's built-in JSON exporter
- Consider rewriting as a custom Tiled plugin for direct export

## Additional Resources

- [Tiled Editor Wiki](https://github.com/bjorn/tiled/wiki)
- [TMX Map Format Documentation](https://github.com/bjorn/tiled/wiki/TMX-Map-Format)
- Original map tools README: `tools/maps/README.md`