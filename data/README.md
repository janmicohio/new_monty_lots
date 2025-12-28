# Data Directory Organization

This directory contains election and property data for the Monty Lots project.

## Directory Structure

```
data/
├── README.md                    # This file
├── DATA_SOURCES.md             # Data source documentation
├── raw/                        # Raw source data (PDFs, original files)
│   ├── 2024/                   # 2024 election PDFs from Montgomery County
│   ├── 2025/                   # 2025 election PDFs from Montgomery County
│   ├── elections24/            # Parsed CSV files from 2024 election PDFs
│   └── elections25/            # Parsed CSV files from 2025 election PDFs
└── elections/                  # Processed election data for visualization
    ├── 2024/                   # 2024 race results (JSON format)
    └── 2025/                   # 2025 race results (JSON format)
```

## Data Processing Pipeline

### 1. Raw Data Collection (`data/raw/`)
- Original PDFs from Montgomery County Board of Elections
- Stored by year (2024/, 2025/)

### 2. CSV Extraction (`data/raw/elections24/`, `data/raw/elections25/`)
- PDFs parsed into CSV files using automated scripts
- One CSV file per race
- Contains precinct-level results

### 3. JSON Transformation (`data/elections/`)
- CSV files converted to JSON for web application
- Optimized structure for frontend consumption
- Includes metadata and calculated fields (turnout percentages, etc.)

## Active Datasets

### Election Data
- **2024 General Election**: 70 races across Montgomery County
- **2025 General Election**: 110 races across Montgomery County
- Coverage: All precincts including sub-precinct divisions

### Property Data (served from `provider-data/`)
- **precincts.geojson**: Base precinct boundaries
- **precincts_2024.geojson**: Precincts with 2024 election data
- **precincts_2025.geojson**: Precincts with 2025 election data
- **housing.geojson**: Housing/property parcels (47MB)
- **registry.geojson**: Property registry data (19MB)

## Data Sources

See [DATA_SOURCES.md](./DATA_SOURCES.md) for detailed information about:
- Source URLs
- Collection dates
- Processing scripts
- Data quality notes

## File Naming Conventions

### Raw CSVs
- Use descriptive race names from official sources
- Example: `Beavercreek CSD - Bond issue 4.9 mills - 37 yrs.csv`

### Processed JSON
- Match CSV filenames with `.json` extension
- Example: `Beavercreek CSD - Bond issue 4.9 mills - 37 yrs.json`

## Data Maintenance

To add new election data:

1. Download PDFs to `data/raw/{year}/`
2. Run parsing script to generate CSVs in `data/raw/elections{year}/`
3. Run transformation script to create JSON files in `data/elections/{year}/`
4. Update precinct GeoJSON files in `provider-data/` if needed

## Storage Considerations

- Raw PDFs: ~5-10MB each (archived, not served to web)
- CSV files: ~1-50KB each (intermediate format, not served)
- JSON files: ~1-50KB each (served via race manifest)
- GeoJSON files: 5-50MB each (served via Koop)

Total data directory size: ~100-200MB
