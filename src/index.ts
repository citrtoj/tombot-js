const http = require('http');
const runServer = require('./server');
require('dotenv').config();

const server = http.createServer((req : any, res : any) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('htt p');
});

server.listen(process.env.PORT, process.env.HOSTNAME, () => {
  console.log(`Server running at http://${server.address().address}:${server.address().port}/`);
});

runServer();