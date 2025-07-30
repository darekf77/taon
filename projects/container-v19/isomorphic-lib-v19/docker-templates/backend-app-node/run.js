const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.HOST_BACKEND_PORT_1;

// Enable CORS
app.use(cors());

// Define a route for '/'
app.get('/', (req, res) => {
  res.json({
    message: 'Simple Express Server',
    status: 'Running',
    env: {
      HOST_BACKEND_PORT_1: process.env.HOST_BACKEND_PORT_1,
      HOST_URL_1: process.env.HOST_URL_1,
      FRONTEND_HOST_URL_1: process.env.FRONTEND_HOST_URL_1,
    },
    timestamp: new Date().toISOString(),
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`

    Server is running on http://localhost:${PORT}

    HOST_BACKEND_PORT_1: "${process.env.HOST_BACKEND_PORT_1}"
    HOST_URL_1: "${process.env.HOST_URL_1}"
    FRONTEND_HOST_URL_1: "${process.env.FRONTEND_HOST_URL_1}"

   `);
});