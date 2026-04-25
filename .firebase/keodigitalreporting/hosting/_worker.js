export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Pass API requests to the Functions logic
    if (url.pathname.startsWith('/api/')) {
      return env.ASSETS.fetch(request);
    }
    
    // Otherwise, serve static assets
    return env.ASSETS.fetch(request);
  },
};
