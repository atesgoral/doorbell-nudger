'use strict';

const express = require('express');
const speakeasy = require('speakeasy');
const qr = require('qr-image');

const app = express();

app.use('/', express.static('static'));

app.get('/qrcode', (req, res) => {
  const secret = speakeasy.generateSecret();

  const token = speakeasy.totp({
    secret: secret.base32,
    encoding: 'base32'
  });

  res.cookie('timeStep', 30);

  qr.image('http://example.com/nudge/' + token).pipe(res);
});

module.exports = app;
