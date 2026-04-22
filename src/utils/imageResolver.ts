/**
 * Dynamic Image Resolver for Prizzo
 * Generates high-quality product images using Unsplash Source.
 * Pattern: https://source.unsplash.com/800x800/?product,white-background,<name>
 */

export const getProductImage = (name: string, category?: string) => {
  if (!name) return 'https://loremflickr.com/800/800/product,white,background';

  // LoremFlickr is more reliable for direct URL search strings
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]+/g, ',');
  const cat = category ? `${category.toLowerCase()},` : '';
  
  return `https://loremflickr.com/800/800/${cat}${cleanName},product/all`;
};
