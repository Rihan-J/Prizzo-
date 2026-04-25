/**
 * ─── Nearby Product Search Service ───
 *
 * Reusable service for finding products near a given location.
 * Extracted from product.controller.js to allow reuse by:
 *   - GET /products/nearby  (product controller)
 *   - POST /orders/smart    (order controller)
 *
 * Contains:
 *   - Haversine-based PostgreSQL geo query
 *   - Price/distance scoring & tagging (cheapest / nearest / best)
 *   - Result sorting
 */

const prisma = require("../config/db");
const cache = require("../utils/cache");
const logger = require("../utils/logger");

const NEARBY_CACHE_TTL = 30; // seconds

// ─── Scoring Helpers ────────────────────────────────────────────────────────────

function normalizeMetric(value, min, max) {
  if (max === min) return 0;
  return (value - min) / (max - min);
}

/**
 * Score each result with a weighted price + distance metric,
 * and tag the cheapest, nearest, and best items.
 */
function addScoresAndTags(results) {
  if (results.length === 0) {
    return { scored: [], cheapest: null, nearest: null, best: null };
  }

  const prices = results.map((item) => item.price);
  const distances = results.map((item) => item.distance);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const minDistance = Math.min(...distances);
  const maxDistance = Math.max(...distances);

  const scored = results.map((item) => {
    const normalizedPrice = normalizeMetric(item.price, minPrice, maxPrice);
    const normalizedDistance = normalizeMetric(item.distance, minDistance, maxDistance);
    const score = (0.6 * normalizedPrice) + (0.4 * normalizedDistance);

    return {
      ...item,
      score: Math.round(score * 10000) / 10000,
      tags: [],
    };
  });

  const cheapest = scored.reduce((best, item) => (
    item.price < best.price || (item.price === best.price && item.distance < best.distance) ? item : best
  ), scored[0]);

  const nearest = scored.reduce((best, item) => (
    item.distance < best.distance || (item.distance === best.distance && item.price < best.price) ? item : best
  ), scored[0]);

  const best = scored.reduce((winner, item) => (
    item.score < winner.score || (item.score === winner.score && item.price < winner.price) ? item : winner
  ), scored[0]);

  for (const item of scored) {
    if (item.productId === cheapest.productId) item.tags.push("cheapest");
    if (item.productId === nearest.productId) item.tags.push("nearest");
    if (item.productId === best.productId) item.tags.push("best");
  }

  return { scored, cheapest, nearest, best };
}

/**
 * Sort scored results by the chosen strategy.
 */
function sortResults(results, sort) {
  const sorted = [...results];
  if (sort === "cheapest") {
    return sorted.sort((a, b) => a.price - b.price || a.distance - b.distance);
  }
  if (sort === "nearest") {
    return sorted.sort((a, b) => a.distance - b.distance || a.price - b.price);
  }
  // default: "best" (lowest composite score)
  return sorted.sort((a, b) => a.score - b.score || a.price - b.price || a.distance - b.distance);
}

// ─── Core Search ────────────────────────────────────────────────────────────────

/**
 * Search for products near a location using Haversine distance.
 *
 * @param {{ lat: number, lng: number, radius: number, query: string }} params
 * @returns {Promise<{ normalizedRows: Array, scored: Array, cheapest: object|null, nearest: object|null, best: object|null }>}
 */
async function searchNearbyProducts({ lat, lng, radius, query }) {
  // ── Check cache first ──
  const cacheKey = `nearby:${query.toLowerCase().trim()}:${radius}:${Number(lat).toFixed(3)}:${Number(lng).toFixed(3)}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    logger.debug({ cacheKey }, "Nearby search cache HIT");
    return cached;
  }

  // ── Bounding box pre-filter ──
  const latDelta = radius / 111.32;
  const lngDelta = radius / (111.32 * Math.max(Math.cos(lat * Math.PI / 180), 0.01));
  const minLat = lat - latDelta;
  const maxLat = lat + latDelta;
  const minLng = lng - lngDelta;
  const maxLng = lng + lngDelta;
  const searchPattern = `%${query}%`;

  // ── Haversine SQL query ──
  const rows = await prisma.$queryRaw`
    SELECT *
    FROM (
      SELECT
        p.id AS "productId",
        p.name AS "productName",
        p.price AS "price",
        p.stock AS "stock",
        p."isAvailable" AS "isAvailable",
        s.id AS "storeId",
        s.name AS "storeName",
        s.address AS "storeAddress",
        s.latitude AS "storeLatitude",
        s.longitude AS "storeLongitude",
        ROUND((
          6371 * acos(
            LEAST(1, GREATEST(-1,
              cos(radians(${lat})) *
              cos(radians(s.latitude)) *
              cos(radians(s.longitude) - radians(${lng})) +
              sin(radians(${lat})) *
              sin(radians(s.latitude))
            ))
          )
        )::numeric, 2)::float AS "distance"
      FROM products p
      INNER JOIN stores s ON s.id = p."storeId"
      WHERE p."isAvailable" = true
        AND p.stock > 0
        AND s.latitude BETWEEN ${minLat} AND ${maxLat}
        AND s.longitude BETWEEN ${minLng} AND ${maxLng}
        AND (
          p.name ILIKE ${searchPattern}
          OR p.description ILIKE ${searchPattern}
        )
    ) nearby
    WHERE nearby."distance" <= ${radius}
  `;

  // ── Normalize rows ──
  const normalizedRows = rows.map((row) => ({
    productId: row.productId,
    productName: row.productName,
    storeId: row.storeId,
    storeName: row.storeName,
    storeAddress: row.storeAddress,
    price: Number(row.price),
    distance: Number(row.distance),
    stock: Number(row.stock),
    isAvailable: Boolean(row.isAvailable),
  }));

  // ── Score and tag ──
  const { scored, cheapest, nearest, best } = addScoresAndTags(normalizedRows);

  const result = { normalizedRows, scored, cheapest, nearest, best };

  // ── Cache for reuse ──
  await cache.set(cacheKey, result, NEARBY_CACHE_TTL);

  return result;
}

module.exports = {
  searchNearbyProducts,
  addScoresAndTags,
  sortResults,
  normalizeMetric,
};
