const { PrismaClient } = require("@prisma/client");
const { categorizeProduct } = require("../src/utils/categorizer");

const prisma = new PrismaClient();

async function runCategorization() {
  console.log("Starting product categorization...");
  
  try {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { category: "" },
          { category: "Uncategorized" },
          { category: "Other" },
          { category: { equals: "grocery", mode: "insensitive" } }
        ]
      }
    });

    console.log(`Found ${products.length} products to categorize.`);

    for (const product of products) {
      let category = "Other";
      let retries = 3;
      
      while (retries > 0) {
        console.log(`Categorizing: ${product.name}... (Attempts left: ${retries})`);
        category = await categorizeProduct(product.name);
        
        if (category !== "Other" || !category.includes("error")) {
          break;
        }
        
        console.log("Rate limit or error hit, waiting 5 seconds before retry...");
        await new Promise(resolve => setTimeout(resolve, 5000));
        retries--;
      }
      
      await prisma.product.update({
        where: { id: product.id },
        data: { category }
      });
      
      console.log(`-> Assigned to: ${category}`);
      
      // Delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log("Categorization complete.");
  } catch (error) {
    console.error("Error during categorization script:", error);
  } finally {
    await prisma.$disconnect();
  }
}

runCategorization();
