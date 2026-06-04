// Category caching utility to share categories across app
// This helps when backend requires auth for categories endpoint

const CACHE_KEY = 'bookstore_categories';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const categoryCache = {
  // Save categories to localStorage
  save: (categories) => {
    const cacheData = {
      categories,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  },

  // Get categories from localStorage
  get: () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const { categories, timestamp } = JSON.parse(cached);
      const isExpired = Date.now() - timestamp > CACHE_DURATION;

      if (isExpired) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      return categories;
    } catch (err) {
      console.error('Failed to read category cache:', err);
      return null;
    }
  },

  // Clear cache
  clear: () => {
    localStorage.removeItem(CACHE_KEY);
  }
};
