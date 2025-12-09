// event on document ready without jquery
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded');
});

const isLocalhost = window.location.href.search('localhost') !== -1;

  // docs-sync-to-parent.js
  // Put in your docs layout / main.ts / app.html
if (window.parent !== window) {
  const tellParent = () => {
    window.parent.postMessage(
      { type: 'IFRAME_PATH_UPDATE', path: location.pathname + location.search },
      isLocalhost ? 'http://localhost:4250': 'https://taon.dev'  // ← change only if you use targetOrigin input
    );
  };

  tellParent();
  window.addEventListener('popstate', tellParent);
  window.addEventListener('hashchange', tellParent);

  ['pushState', 'replaceState'].forEach(method => {
    const orig = history[method];
    history[method] = function (...args) {
      orig.apply(this, args);
      setTimeout(tellParent, 0);
    };
  });
}

// 2. Listen for NAVIGATE commands FROM parent
window.addEventListener('message', (event) => {
  // Security: only accept from your Angular app

  if(!isLocalhost) {
    if (event.origin !== 'https://taon.dev') return;
  }

  console.log('Received message in iframe:', event.data);

  if (event.data?.type === 'NAVIGATE') {
    const newPath = event.data.path || '/';
    const currentFull = location.pathname + location.search;
    const currentPath = location.pathname;

    // If it's actually a different page → FULL HARD REFRESH
    if (newPath !== currentFull && newPath !== currentPath) {
      // This forces a real HTTP request → fresh page, no SPA cache issues
      location.href = newPath;
    }
    // If it's the same → do nothing (prevents loops)
  }
});

