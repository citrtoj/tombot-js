const http = require('http');
const runServer = require('./server');
require('dotenv').config();

const hostname = '127.0.0.1';
const port = 8080;

const server = http.createServer((req : any, res : any) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('htt p');
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

runServer();