/**
 * Dynamic Image Resolver for Prizzo
 * Generates high-quality product images using Unsplash Source.
 * Pattern: https://source.unsplash.com/800x800/?product,white-background,<name>
 */

export const getProductImage = (name: string, category?: string) => {
  if (!name) return 'https://tse1.mm.bing.net/th?q=product+placeholder&w=800&h=800&c=7&rs=1&p=0&dpr=1&pid=1.7&mkt=en-US&adlt=on';

  // Bing's Thumbnail API is highly accurate for real-world product images
  const cleanName = encodeURIComponent(name.toLowerCase() + (category ? ` ${category}` : '') + ' white background');
  
  return `https://tse1.mm.bing.net/th?q=${cleanName}&w=800&h=800&c=7&rs=1&p=0&dpr=1&pid=1.7&mkt=en-US&adlt=on`;
};
