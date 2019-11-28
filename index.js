require('dotenv').config({ path: './config/env' });

const port = 3001;
const app = require('./app/express');

const start = async () => {
  app.listen(port, '127.0.0.1', () => {
  })
};

start();
