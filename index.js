const Koop = require('@koopjs/koop-core');
const provider = require('@koopjs/provider-file-geojson');
const path = require('path');
const fs = require('fs');
const koop = new Koop({ logLevel: 'debug' });
const output = require('koop-output-geojson');
const geojsonValidation = require('geojson-validation');

// const auth = require('@koopjs/auth-direct-file')(
//   'pass-in-your-secret',
//   `${__dirname}/user-store.json`
// );

// koop.register(auth);
koop.register(output);
koop.register(provider, { dataDir: './provider-data' });

// Serve static files
koop.server.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

koop.server.use('/static', require('express').static(path.join(__dirname, 'static')));

// Service catalog endpoint with GeoJSON validation
koop.server.get('/catalog', (req, res) => {
  const fs = require('fs');
  const dataDir = path.join(__dirname, 'provider-data');

  fs.readdir(dataDir, (err, files) => {
    if (err) {
      console.error('Error reading data directory:', err);
      return res.status(500).json({ error: 'Unable to read data directory' });
    }

    const geojsonFiles = [];
    const validationErrors = [];

    files
      .filter(file => file.endsWith('.geojson'))
      .forEach(file => {
        const layerId = path.basename(file, '.geojson');
        const filePath = path.join(dataDir, file);

        try {
          // Read and parse GeoJSON file
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const geojson = JSON.parse(fileContent);

          // Validate GeoJSON structure
          const isValid = geojsonValidation.valid(geojson);

          if (isValid) {
            geojsonFiles.push({
              id: layerId,
              name: layerId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              type: 'FeatureServer',
              url: `/file-geojson/rest/services/${layerId}/FeatureServer`,
              queryUrl: `/file-geojson/rest/services/${layerId}/FeatureServer/0/query`
            });
          } else {
            const errors = geojsonValidation.isFeatureCollection(geojson) ||
                          geojsonValidation.isFeature(geojson) ||
                          geojsonValidation.isGeometryObject(geojson) ||
                          ['Invalid GeoJSON structure'];

            console.warn(`⚠️  Skipping invalid GeoJSON file: ${file}`, errors);
            validationErrors.push({
              file: file,
              errors: Array.isArray(errors) ? errors : [errors]
            });
          }
        } catch (error) {
          console.error(`⚠️  Error validating ${file}:`, error.message);
          validationErrors.push({
            file: file,
            errors: [error.message]
          });
        }
      });

    const response = {
      services: geojsonFiles,
      count: geojsonFiles.length
    };

    // Include validation errors in response if any (for debugging)
    if (validationErrors.length > 0) {
      response.validationErrors = validationErrors;
      console.warn(`Found ${validationErrors.length} invalid GeoJSON file(s)`);
    }

    res.json(response);
  });
});

// Health check endpoint for monitoring
koop.server.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Style configuration cache
let styleConfigCache = {};
let mainStyleConfig = null;

// Load and cache style configurations
function loadStyleConfig(configPath) {
  try {
    const fullPath = path.resolve(__dirname, configPath);
    const configData = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.warn(`Failed to load style config from ${configPath}:`, error.message);
    return null;
  }
}

// Load main styles configuration
function loadMainStyleConfig() {
  try {
    mainStyleConfig = loadStyleConfig('./config/styles.json');
    if (mainStyleConfig) {
      console.log('✓ Main style configuration loaded');
      
      // Pre-load layer configurations
      if (mainStyleConfig.layers) {
        Object.entries(mainStyleConfig.layers).forEach(([layerId, layerInfo]) => {
          if (layerInfo.enabled && layerInfo.configFile) {
            const layerConfig = loadStyleConfig(`./config/${layerInfo.configFile}`);
            if (layerConfig) {
              styleConfigCache[layerId] = layerConfig;
              console.log(`✓ Loaded style config for layer: ${layerId}`);
            }
          }
        });
      }
    }
  } catch (error) {
    console.warn('Failed to load main style configuration:', error.message);
  }
}

// Style configuration API endpoints
koop.server.get('/api/styles/config', (req, res) => {
  if (!mainStyleConfig) {
    return res.status(500).json({ error: 'Style configuration not loaded' });
  }
  res.json(mainStyleConfig);
});

koop.server.get('/api/styles/config/:layerId', (req, res) => {
  const layerId = req.params.layerId;
  
  // Check cache first
  if (styleConfigCache[layerId]) {
    return res.json(styleConfigCache[layerId]);
  }
  
  // Try to load from main config
  if (mainStyleConfig && mainStyleConfig.layers && mainStyleConfig.layers[layerId]) {
    const layerInfo = mainStyleConfig.layers[layerId];
    if (layerInfo.configFile) {
      const layerConfig = loadStyleConfig(`./config/${layerInfo.configFile}`);
      if (layerConfig) {
        styleConfigCache[layerId] = layerConfig; // Cache it
        return res.json(layerConfig);
      }
    }
  }
  
  // Fallback: return default configuration
  res.json({
    name: layerId,
    defaultStyle: {
      color: '#666666',
      fillColor: '#cccccc',
      fillOpacity: 0.7,
      radius: 6,
      weight: 2
    },
    styleRules: []
  });
});

// Initialize style configuration on startup
loadMainStyleConfig();

koop.server.listen(process.env.PORT || 8080);
