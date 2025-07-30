const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 80;
const ROOT_DIR = path.resolve(__dirname); // adjust if needed

// Serve static files except index.js
app.use((req, res, next) => {
  if (req.path === '/' || req.path === '/index.js') return next();
  express.static(ROOT_DIR)(req, res, next);
});

const publicEnv = Object.fromEntries(
  Object.entries(process.env).filter(([key]) =>
    key.startsWith('PUBLIC_') || key.startsWith('HOST_') || key.startsWith('FRONTEND_')
  )
);

// Generic index.html + ENV injection
app.get('/', (req, res) => {
  const indexPath = path.join(ROOT_DIR, 'index.html');
  if (!fs.existsSync(indexPath)) {
    return res.status(404).send('index.html not found');
  }

  let html = fs.readFileSync(indexPath, 'utf8');

  const envScript = `<script>
    window.ENV = ${JSON.stringify(publicEnv, null, 2)};
  </script>`;

  // Inject before </head> if found
  html = html.replace(/<\/head>/i, `${envScript}\n</head>`);

  res.type('html').send(html);
});

app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
});
