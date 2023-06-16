const http = require('http');
const runServer = require('./server');
require('dotenv').config();

const hostname = '0.0.0.0';

const server = http.createServer((req : any, res : any) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('htt p'); //inside joke
});

server.listen(process.env.PORT || 5000, hostname, () => {
  console.log(`Server running at http://${hostname}:${process.env.PORT}/`);
});

runServer();