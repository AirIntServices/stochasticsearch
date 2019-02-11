const path = require('path')
const express = require('express');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const compress = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes/');

function ignoreFavicon(req, res, next) {
  if (req.originalUrl === '/favicon.ico') {
    res.status(204).json({ nope: true });
  } else {
    next();
  }
}

const app = express();

app.use(ignoreFavicon);

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(helmet());

app.use(cors());

app.use(fileUpload());

app.use('/v0/', routes);

app.use('/static', express.static(path.join(__dirname, '../static')))

module.exports = app;
