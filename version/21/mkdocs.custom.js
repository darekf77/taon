;(() => {
  if (window.parent === window) return;

  const isDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const parentOrigin = isDev ? 'http://localhost:4202' : 'https://taon.dev';

  let hasSentReady = false;

  const tellParentReady = () => {
    if (hasSentReady) return;
    hasSentReady = true;

    window.parent.postMessage(
      { type: 'IFRAME_READY' },
      parentOrigin
    );
  };

  const tellParentPath = () => {
    window.parent.postMessage(
      { type: 'IFRAME_PATH_UPDATE', path: location.pathname + location.search },
      parentOrigin
    );
  };

  // Send READY + path on first real load
  const onFirstLoad = () => {
    tellParentReady();
    tellParentPath();
  };

  // Initial load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onFirstLoad);
  } else {
    onFirstLoad();
  }

  // Subsequent SPA navigations
  window.addEventListener('popstate', tellParentPath);
  window.addEventListener('hashchange', tellParentPath);

  ['pushState', 'replaceState'].forEach(method => {
    const orig = history[method];
    history[method] = function (...args) {
      orig.apply(this, args);
      setTimeout(tellParentPath, 0);
    };
  });

  // Listen for parent navigation
  window.addEventListener('message', event => {
    if (event.origin !== parentOrigin) return;

    if (event.data?.type === 'NAVIGATE') {
      const newPath = event.data.path || '/';
      const current = location.pathname + location.search;

      if (newPath !== current && newPath !== location.pathname) {
        hasSentReady = false; // Reset so next page will send READY again
        location.href = newPath;
      }
    }
  });
})();