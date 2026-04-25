const Groq = require("groq-sdk");
const prisma = require("../config/db");
const logger = require("../utils/logger");
const { sendSuccess, sendError } = require("../utils/response");
const { searchNearbyProducts, sortResults } = require("../services/nearby.service");

const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

// ── Strict system prompt — forces JSON-only, no conversation ──
const SYSTEM_PROMPT = `You are a product search intent parser. You are NOT a chatbot. Do NOT have conversations.

Your ONLY job: parse user input into a JSON action object. Return ONLY valid JSON, nothing else.

Supported intents:
- nearby_search — user wants to find products NEAR THEM (keywords: near me, nearby, around me, within, closest, near)
- search_product — user wants to find/search/look for a product (no location keywords)
- compare_prices — user wants to compare prices, find cheapest, best price, best deal
- smart_buy — user wants to buy/order/purchase a product instantly
- add_to_cart — user wants to add a product to cart
- track_order — user wants to see/track/check their orders

Rules:
1. ALWAYS return JSON. Never return plain text.
2. NEVER ask follow-up questions.
3. If the user types a product name with no verb, assume intent is "search_product".
4. If input contains "near me", "nearby", "around me", "within", "closest", "near" → intent is "nearby_search".
5. If the user says "buy" or "order" → intent is "smart_buy".
6. If the user says "compare" or "cheapest" or "best price" → intent is "compare_prices".
7. If the user says "cart" or "add" → intent is "add_to_cart".
8. If the user says "orders" or "track" or "status" → intent is "track_order".
9. Extract quantity if mentioned, default to 1.
10. Strip location keywords ("near me", "nearby", etc.) from the query field.

Output format (STRICT):
{"intent":"search_product","query":"milk","quantity":1}

More examples:
"paper napkin near me" → {"intent":"nearby_search","query":"paper napkin","quantity":1}
"napkin paper" → {"intent":"search_product","query":"napkin paper","quantity":1}
"milk nearby" → {"intent":"nearby_search","query":"milk","quantity":1}
"buy 2 rice" → {"intent":"smart_buy","query":"rice","quantity":2}
"compare charger prices" → {"intent":"compare_prices","query":"charger","quantity":1}
"add bread to cart" → {"intent":"add_to_cart","query":"bread","quantity":1}
"my orders" → {"intent":"track_order","query":"","quantity":1}
"cheapest dosa nearby" → {"intent":"nearby_search","query":"dosa","quantity":1}
"paracetamol around me" → {"intent":"nearby_search","query":"paracetamol","quantity":1}
"find stores near me selling rice" → {"intent":"nearby_search","query":"rice","quantity":1}`;

// ── Location keyword patterns ──
const NEARBY_PATTERN = /\b(near\s*me|nearby|around\s*me|within\s*\d*\s*km|closest|near\s*by|near\b)/i;
const LOCATION_STRIP_PATTERN = /\b(near\s*me|nearby|around\s*me|within\s*\d*\s*km|closest|near\s*by|near|stores?|find|show|selling)\b/gi;

// ── Keyword-based fallback intent detection (no AI needed) ──
function detectIntentFromKeywords(message) {
  const msg = message.toLowerCase().trim();

  // Track orders — check FIRST (highest specificity)
  if (/\b(order|orders|track|tracking|status|delivery|my order)\b/.test(msg)) {
    return { intent: "track_order", query: "", quantity: 1 };
  }

  // Nearby search — check BEFORE compare/buy since "cheapest nearby" = nearby
  if (NEARBY_PATTERN.test(msg)) {
    const query = msg.replace(LOCATION_STRIP_PATTERN, "").replace(/\s+/g, " ").trim();
    return { intent: "nearby_search", query: query || msg, quantity: 1 };
  }

  // Smart buy
  const buyMatch = msg.match(/\b(?:buy|purchase|smart buy)\b\s*(\d+)?\s*(.*)/i);
  if (buyMatch) {
    const quantity = parseInt(buyMatch[1]) || 1;
    const query = buyMatch[2]?.trim() || msg.replace(/\b(?:buy|purchase|smart buy)\b/gi, "").trim();
    if (query.length > 0) {
      return { intent: "smart_buy", query, quantity };
    }
  }

  // Compare prices
  if (/\b(compare|cheapest|best price|lowest price|price compare|best deal)\b/.test(msg)) {
    const query = msg.replace(/\b(compare|cheapest|best price|lowest price|price compare|best deal|prices?)\b/gi, "").trim();
    return { intent: "compare_prices", query: query || msg, quantity: 1 };
  }

  // Add to cart
  if (/\b(add|cart)\b/i.test(msg)) {
    const quantityMatch = msg.match(/(\d+)/);
    const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
    const query = msg.replace(/\b(add|to|cart|my)\b/gi, "").replace(/\d+/g, "").trim();
    if (query.length > 0) {
      return { intent: "add_to_cart", query, quantity };
    }
  }

  // Default: treat entire message as a product search
  return { intent: "search_product", query: msg, quantity: 1 };
}

// ── Context-recall detection (includes "buy this", "order this", "add this") ──
function isContextRecall(message) {
  const msg = message.toLowerCase().trim();
  return /\b(show again|again|repeat|where is it|same|last|previous|show me again|one more time|re-?search)\b/.test(msg);
}

function isContextAction(message) {
  const msg = message.toLowerCase().trim();
  const match = msg.match(/\b(buy|order|add|cart)\b\s*(this|that|it|these|them|the same)/i);
  if (match) {
    const verb = match[1].toLowerCase();
    if (verb === "buy" || verb === "order") return "smart_buy";
    if (verb === "add" || verb === "cart") return "add_to_cart";
  }
  return null;
}

// ── Execute intent against real database ──
async function executeIntent(intent, query, quantity, userId, lat, lng) {
  switch (intent) {
    case "nearby_search": {
      if (!query || query.length < 1) {
        return { results: [], total: 0, message: "What product should I find near you?", type: "nearby" };
      }

      // Require location
      if (!lat || !lng) {
        return { results: [], total: 0, message: "📍 Please enable location to find nearby stores.", type: "nearby", needsLocation: true };
      }

      // Primary: nearby geo-search
      try {
        const { scored } = await searchNearbyProducts({
          lat: parseFloat(lat), lng: parseFloat(lng),
          radius: 3, query,
        });
        const sorted = sortResults(scored, "best");
        const results = sorted.slice(0, 6);

        if (results.length > 0) {
          const cheapest = results.reduce((a, b) => a.price < b.price ? a : b);
          const nearest = results.reduce((a, b) => a.distance < b.distance ? a : b);

          // Tag cheapest/nearest for frontend highlighting
          results.forEach(r => {
            r._tags = [];
            if (r.productId === cheapest.productId) r._tags.push("cheapest");
            if (r.productId === nearest.productId) r._tags.push("nearest");
          });

          const message = `Found best prices for "${query}" near you 👇`;
          return { results, total: results.length, type: "nearby", message };
        }
      } catch (err) {
        logger.warn({ err: err.message }, "[Nearby search failed, falling back]");
      }

      // Fallback: global product search if no nearby results
      const fallbackProducts = await prisma.product.findMany({
        where: {
          isAvailable: true,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true, name: true, price: true, category: true,
          stock: true, isAvailable: true,
          store: { select: { id: true, name: true, address: true } },
        },
        orderBy: { price: "asc" },
        take: 6,
      });

      if (fallbackProducts.length > 0) {
        return {
          products: fallbackProducts,
          total: fallbackProducts.length,
          type: "fallback",
          message: `No nearby stores found for "${query}". Showing other options 👇`,
        };
      }

      return { results: [], total: 0, type: "nearby", message: `No products found for "${query}" nearby or anywhere. Try a different name.` };
    }

    case "search_product": {
      if (!query || query.length < 1) {
        return { products: [], total: 0, message: "What product are you looking for?" };
      }
      const products = await prisma.product.findMany({
        where: {
          isAvailable: true,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { category: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true, name: true, price: true, category: true,
          stock: true, isAvailable: true,
          store: { select: { id: true, name: true, address: true } },
        },
        orderBy: { price: "asc" },
        take: 6,
      });

      const total = products.length;
      const message = total > 0
        ? `Found ${total} result${total > 1 ? "s" : ""} for "${query}" 🔍`
        : `No products found for "${query}". Try a different name.`;

      return { products, total, message };
    }

    case "compare_prices": {
      if (!query || query.length < 1) {
        return { results: [], total: 0, message: "Which product should I compare prices for?" };
      }

      // Try nearby search first if location available
      if (lat && lng) {
        try {
          const { scored } = await searchNearbyProducts({
            lat: parseFloat(lat), lng: parseFloat(lng),
            radius: 5, query,
          });
          const sorted = sortResults(scored, "cheapest");
          const results = sorted.slice(0, 6);

          if (results.length > 0) {
            const cheapest = results[0]; // already sorted cheapest-first
            results.forEach(r => {
              r._tags = [];
              if (r.productId === cheapest.productId) r._tags.push("cheapest");
            });

            return {
              results, total: results.length, type: "nearby",
              message: `Comparing ${results.length} prices for "${query}" — cheapest: ₹${cheapest.price} at ${cheapest.storeName} 💰`,
            };
          }
        } catch {
          // Fall through
        }
      }

      // Fallback: regular DB search sorted by price
      const products = await prisma.product.findMany({
        where: {
          isAvailable: true,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true, name: true, price: true,
          store: { select: { id: true, name: true } },
        },
        orderBy: { price: "asc" },
        take: 6,
      });

      const total = products.length;
      const message = total > 0
        ? `Comparing ${total} price${total > 1 ? "s" : ""} for "${query}" — cheapest first 💰`
        : `No products found for "${query}" to compare.`;
      return { products, total, type: "search", message };
    }

    case "smart_buy": {
      if (!query || query.length < 1) {
        return { products: [], message: "Which product should I Smart Buy?" };
      }
      const products = await prisma.product.findMany({
        where: {
          isAvailable: true,
          stock: { gte: quantity || 1 },
          OR: [{ name: { contains: query, mode: "insensitive" } }],
        },
        select: {
          id: true, name: true, price: true, stock: true,
          store: { select: { id: true, name: true } },
        },
        orderBy: { price: "asc" },
        take: 3,
      });

      const total = products.length;
      const message = total > 0
        ? `Ready to Smart Buy "${query}" — pick one below ⚡`
        : `No available products found for "${query}" with enough stock.`;
      return { products, total, quantity: quantity || 1, action: "smart_buy", requiresConfirmation: true, message };
    }

    case "add_to_cart": {
      if (!query || query.length < 1) {
        return { products: [], message: "Which product should I add to your cart?" };
      }
      const products = await prisma.product.findMany({
        where: {
          isAvailable: true,
          OR: [{ name: { contains: query, mode: "insensitive" } }],
        },
        select: {
          id: true, name: true, price: true, stock: true,
          store: { select: { id: true, name: true } },
        },
        orderBy: { price: "asc" },
        take: 3,
      });

      const total = products.length;
      const message = total > 0
        ? `Found ${total} option${total > 1 ? "s" : ""} for "${query}" — tap to add 🛒`
        : `No products found for "${query}" to add to cart.`;
      return { products, total, quantity: quantity || 1, action: "add_to_cart", requiresConfirmation: true, message };
    }

    case "track_order": {
      const orders = await prisma.order.findMany({
        where: { userId },
        select: {
          id: true, status: true, totalAmount: true, createdAt: true,
          store: { select: { name: true } },
          items: {
            select: {
              quantity: true, price: true,
              product: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      const total = orders.length;
      const message = total > 0
        ? `Here are your ${total} most recent order${total > 1 ? "s" : ""} 📦`
        : "You don't have any orders yet. Start shopping! 🛒";
      return { orders, total, message };
    }

    default:
      return { message: "I can search products, compare prices, find nearby stores, place orders, or track your orders." };
  }
}

/**
 * POST /ai/chat
 * Body: { message, lat, lng, lastQuery, lastIntent, lastProducts }
 */
const chat = async (req, res) => {
  try {
    const { message, lat, lng, lastQuery, lastIntent, lastProducts } = req.body;
    const userId = req.user.userId;

    if (!message || typeof message !== "string" || message.trim().length < 1) {
      return sendError(res, 400, "Message is required.");
    }

    const userMessage = message.trim();

    // ── Step 1: Check for "buy this" / "add this" context actions ──
    const contextAction = isContextAction(userMessage);
    if (contextAction && lastQuery) {
      const data = await executeIntent(contextAction, lastQuery, 1, userId, lat, lng);
      return sendSuccess(res, 200, {
        intent: contextAction,
        query: lastQuery,
        quantity: 1,
        reply: data.message,
        data,
      });
    }

    // ── Step 2: Check for "show again" context recall ──
    if (isContextRecall(userMessage) && lastQuery) {
      const data = await executeIntent(lastIntent || "search_product", lastQuery, 1, userId, lat, lng);
      return sendSuccess(res, 200, {
        intent: lastIntent || "search_product",
        query: lastQuery,
        quantity: 1,
        reply: data.message,
        data,
      });
    }

    // ── Step 3: Try Groq for intent parsing ──
    let parsed = null;

    if (groq) {
      try {
        const completion = await Promise.race([
          groq.chat.completions.create({
            model: GROQ_MODEL,
            temperature: 0,
            max_tokens: 80,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: userMessage },
            ],
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("AI timeout")), 4000)
          ),
        ]);

        const raw = completion.choices?.[0]?.message?.content?.trim();

        // Extract JSON from response (handle markdown code blocks)
        let jsonStr = raw;
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) jsonStr = jsonMatch[0];

        parsed = JSON.parse(jsonStr);

        // Validate parsed output
        if (!parsed.intent || typeof parsed.intent !== "string") {
          parsed = null;
        }
      } catch (aiErr) {
        logger.warn({ err: aiErr.message, msg: userMessage }, "[AI Chat] Groq failed, using keyword fallback");
        parsed = null;
      }
    }

    // ── Step 4: Fallback to keyword detection if Groq failed ──
    if (!parsed) {
      parsed = detectIntentFromKeywords(userMessage);
    }

    const { intent, query, quantity } = parsed;
    const finalQuery = (query || "").trim();

    // ── Step 5: Execute action against real database ──
    const data = await executeIntent(intent, finalQuery, quantity || 1, userId, lat, lng);

    return sendSuccess(res, 200, {
      intent,
      query: finalQuery,
      quantity: quantity || 1,
      reply: data.message,
      data,
    });
  } catch (error) {
    logger.error({ err: error }, "[AI Chat Error]");
    return sendError(res, 500, "Chat service encountered an error.");
  }
};

module.exports = { chat };
