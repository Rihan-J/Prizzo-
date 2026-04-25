const Groq = require("groq-sdk");
require("dotenv").config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const GROCERY_CATEGORIES = [
  "Fruits & Vegetables",
  "Dairy & Bakery",
  "Beverages",
  "Snacks & Branded Foods",
  "Kitchen & Household",
  "Beauty & Hygiene",
  "Gourmet & World Food",
  "Baby Care",
  "Meat & Eggs",
  "Cleaning & Household",
  "Health & Wellness",
  "Instant Food & Ready to Cook",
  "Pet Care",
  "Stationery"
];

/**
 * Categorizes a product based on its name using Groq AI.
 * @param {string} productName - The name of the product.
 * @returns {Promise<string>} - The predicted category.
 */
async function categorizeProduct(productName) {
  if (!productName) return "Uncategorized";

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an expert product categorizer for a grocery platform. 
          Categorize the given product name into exactly ONE of the following categories:
          ${GROCERY_CATEGORIES.join(", ")}.
          
          If the product does not fit any category, respond with "Other".
          Respond with ONLY the category name, no punctuation or explanation.`,
        },
        {
          role: "user",
          content: productName,
        },
      ],
      model: process.env.GROQ_MODEL || "llama3-8b-8192",
      temperature: 0,
    });

    const category = chatCompletion.choices[0]?.message?.content?.trim();
    
    // Validate if the returned category is in our list
    if (GROCERY_CATEGORIES.includes(category)) {
      return category;
    }
    
    return "Other";
  } catch (error) {
    console.error("Error categorizing product:", error.message);
    return "Other";
  }
}

module.exports = {
  categorizeProduct,
  GROCERY_CATEGORIES
};
