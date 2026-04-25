const Groq = require("groq-sdk");

const cache = require("../utils/cache");
const logger = require("../utils/logger");
const { redisClient, redisHealthCheck } = require("../config/redis");

const AI_TIMEOUT_MS = 1500;
const AI_CACHE_TTL_SECONDS = 90;
const AI_RATE_LIMIT_PER_MINUTE = parseInt(process.env.AI_RATE_LIMIT_PER_MINUTE, 10) || 60;
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

function roundCoordinate(value) {
  return Number(value).toFixed(3);
}

function normalizeQuery(query) {
  return String(query || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function buildNearbyAiCacheKey({ query, radius, lat, lng }) {
  return `ai:nearby:${normalizeQuery(query)}:${radius}:${roundCoordinate(lat)}:${roundCoordinate(lng)}`;
}

function deterministicNearbySummary({ cheapest, nearest, best }) {
  if (!best) return "No nearby in-stock options were found.";

  if (cheapest?.productId === nearest?.productId && cheapest?.productId === best.productId) {
    return `${best.storeName} is the best choice because it is both the cheapest and nearest option.`;
  }

  if (best.productId === cheapest?.productId) {
    return `${best.storeName} is the best choice because it has the lowest price with a reasonable distance.`;
  }

  if (best.productId === nearest?.productId) {
    return `${best.storeName} is the best choice because it is closest while keeping the price competitive.`;
  }

  return `${best.storeName} is the best balance between price and distance.`;
}

async function canUseAiThisMinute() {
  const redisOk = await redisHealthCheck();
  if (!redisOk || !redisClient) return false;

  const key = "ai_calls_per_minute";
  const count = await redisClient.incr(key);
  if (count === 1) {
    await redisClient.expire(key, 60);
  }

  return count <= AI_RATE_LIMIT_PER_MINUTE;
}

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("AI request timed out")), timeoutMs);
    }),
  ]);
}

async function requestGroqSummary({ query, results }) {
  const compactResults = results.slice(0, 8).map((item) => ({
    store: item.storeName,
    price: item.price,
    distance: item.distance,
  }));

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    temperature: 0.2,
    max_tokens: 40,
    messages: [
      {
        role: "system",
        content: "Analyze nearby store options and recommend the best choice based on price and distance. Respond in 1 short sentence.",
      },
      {
        role: "user",
        content: JSON.stringify({ query, results: compactResults }),
      },
    ],
  });

  return completion.choices?.[0]?.message?.content?.trim() || null;
}

async function getNearbyRecommendationSummary({ query, radius, lat, lng, results, cheapest, nearest, best }) {
  const fallbackSummary = deterministicNearbySummary({ cheapest, nearest, best });
  if (!groq || results.length === 0) return fallbackSummary;

  const cacheKey = buildNearbyAiCacheKey({ query, radius, lat, lng });

  try {
    const cached = await cache.get(cacheKey);
    if (cached?.summary) return cached.summary;

    const allowed = await canUseAiThisMinute();
    if (!allowed) return fallbackSummary;

    const summary = await withTimeout(requestGroqSummary({ query, results }), AI_TIMEOUT_MS);
    if (!summary) return fallbackSummary;

    await cache.set(cacheKey, { summary }, AI_CACHE_TTL_SECONDS);
    return summary;
  } catch (error) {
    logger.warn({ err: error.message }, "Nearby AI summary skipped");
    return fallbackSummary;
  }
}

module.exports = {
  getNearbyRecommendationSummary,
  deterministicNearbySummary,
  buildNearbyAiCacheKey,
};
