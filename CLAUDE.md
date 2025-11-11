# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm start` - Start the Koop server (production mode)
- `npm run dev` - Start with nodemon for auto-restart during development
- `npm install` - Install dependencies

### Server
- Server runs on port 8080 by default (configurable via PORT environment variable)
- Access the web interface at http://localhost:8080
- Service catalog API at http://localhost:8080/catalog

## Architecture

This project implements a **Koop-based GeoJSON server** with dynamic service discovery and a full-screen Leaflet frontend.

### Core Components

**Backend (`index.js`)**:
- Koop server with `@koopjs/provider-file-geojson` for serving local GeoJSON files
- Custom `/catalog` endpoint that scans `/provider-data` directory and returns service metadata
- Static file serving for the frontend interface
- Automatic service registration for any `.geojson` files in the data directory

**Frontend (`index.html`)**:
- Full-screen map interface with informational sidebar
- Dynamic layer discovery via `/catalog` endpoint
- Automatic loading and styling of all available layers
- Service-specific styling and popup content generation

**Data Flow**:
1. Server scans `/provider-data` for `.geojson` files on catalog requests
2. Each file becomes a service accessible at `/file-geojson/rest/services/{filename}/FeatureServer`
3. Frontend fetches catalog, then loads each layer via Koop's query endpoints
4. Layers are styled and displayed based on geometry type and filename

### Koop API Endpoints

All GeoJSON files are automatically served through standard Koop FeatureServer endpoints:
- `/file-geojson/rest/services/{layer}/FeatureServer` - Service metadata
- `/file-geojson/rest/services/{layer}/FeatureServer/0/query` - Feature query endpoint
- Custom `/catalog` endpoint returns list of all available services

### Data Management

**Zero-configuration approach**: Simply add `.geojson` files to `/provider-data/` directory. The server automatically:
- Discovers new files
- Registers them as Koop services  
- Makes them available via the catalog API
- Loads them in the frontend interface

**Sample data patterns**:
- Points with various coordinate systems (point.geojson, point-3857.geojson)
- Complex polygons with metadata (polygon.geojson with interval/label properties)
- Points with string IDs and metadata (points-w-metadata-id-string.geojson)

### Frontend Architecture

**Service Discovery Pattern**: Frontend calls `/catalog` to get available services, then dynamically loads each layer without hardcoding layer names.

**Dynamic Styling System**: Configuration-driven styling with `StyleResolver` class that applies styles based on feature properties rather than hardcoded layer names.

**Error Handling**: Graceful fallback to common layer names if catalog fails, with status indicators in sidebar.

### Dynamic Styling System

**Configuration Structure**: JSON-based configuration system located in `/config/` directory:
- `styles.json` - Main index configuration with global settings
- `layers/housing.json` - Housing layer styling (Grade_Code property)  
- `layers/registry.json` - Registry layer styling (agent_type property)
- `schemas/layer-config.schema.json` - Validation schema

**Styling Rules**: Support for categorical and numeric rule types:
- **Categorical**: Map discrete property values to specific styles
- **Numeric**: Apply styles based on value ranges (future enhancement)
- **Conditional**: Complex logic-based styling (future enhancement)

**API Endpoints**:
- `GET /api/styles/config` - Main configuration index
- `GET /api/styles/config/:layerId` - Layer-specific styling configuration

**StyleResolver Class**: Frontend processing engine that:
- Evaluates feature properties against configured rules
- Returns appropriate styles for map rendering
- Generates legend data for UI display
- Caches styles for performance

**Legend System**: Dynamic legend generation that:
- Shows color coding for active style rules
- Updates automatically when layers are loaded/unloaded  
- Collapsible interface positioned at bottom-left
- Rule-based legend items with descriptions

### Dependencies

**Server**: `@koopjs/koop-core` (v10.4.17), `@koopjs/provider-file-geojson` (v2.2.0), `koop-output-geojson` (v1.1.2)

**Frontend**: Leaflet v1.9.4 (CDN), vanilla JavaScript with fetch API