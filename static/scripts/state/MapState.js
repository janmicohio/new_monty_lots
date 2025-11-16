/**
 * MapState.js
 * Manages the Leaflet map instance and global map state
 */

// Map instance (initialized in main.js)
export let map = null;

/**
 * Initialize the map instance
 * @param {L.Map} mapInstance - The Leaflet map instance
 */
export function setMap(mapInstance) {
  map = mapInstance;
}

/**
 * Get the map instance
 * @returns {L.Map} The Leaflet map instance
 */
export function getMap() {
  return map;
}
