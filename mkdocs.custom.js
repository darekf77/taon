// event on document ready without jquery
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded');
});

// Put this once in your docs (layout.html, main.ts, etc.)
;(() => {
  if (window.parent === window) return;

  // location.href = '/Start/'

  const isDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const parentOrigin = isDev ? 'http://localhost:4250' : 'https://taon.dev';

  const tellParent = () => {
    window.parent.postMessage(
      { type: 'IFRAME_PATH_UPDATE', path: location.pathname + location.search },
      parentOrigin
    );
  };

  // Initial + all navigations
  tellParent();
  window.addEventListener('popstate', tellParent);
  window.addEventListener('hashchange', tellParent);

  // Monkey-patch history for SPA routers
  ['pushState', 'replaceState'].forEach(method => {
    const orig = history[method];
    history[method] = function (...args) {
      orig.apply(this, args);
      setTimeout(tellParent, 0);
    };
  });

  // Listen for parent commands → HARD NAVIGATE if path changed
  window.addEventListener('message', event => {
    if (event.origin !== parentOrigin) return;

    if (event.data?.type === 'NAVIGATE') {
      const newPath = event.data.path || '/';
      const current = location.pathname + location.search;

      if (newPath !== current && newPath !== location.pathname) {
        // Full hard refresh — guaranteed fresh state
        location.href = newPath;
      }
    }
  });
})();
