/**
 * Dynamic Image Resolver for Prizzo
 * Generates high-quality product images using Unsplash Source.
 * Pattern: https://source.unsplash.com/800x800/?product,white-background,<name>
 */

export const getProductImage = (name: string, category?: string) => {
  if (!name) return 'https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=800&auto=format&fit=crop';

  const cleanName = name.toLowerCase().replace(/\s+/g, ',');
  const cat = category ? `${category},` : '';
  
  // Using a robust Unsplash URL pattern that tends to give professional product shots
  return `https://source.unsplash.com/featured/800x800/?${cat}${cleanName},product,white-background`;
};
