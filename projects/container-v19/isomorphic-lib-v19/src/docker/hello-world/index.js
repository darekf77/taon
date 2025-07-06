const http = require('http');

const server = http.createServer((req, res) => {
  res.end('Hello, world from custom Dockerfile!\n');
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});

