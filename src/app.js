'use strict';

const express = require('express');
const speakeasy = require('speakeasy');
const qr = require('qr-image');

const app = express();

const secret = speakeasy.generateSecret();

app.use('/', express.static(__dirname + '/static'));

app.get('/qrcode', (req, res) => {
  const token = speakeasy.totp({
    secret: secret.base32,
    encoding: 'base32',
    step: 30
  });

  res.cookie('token', token);

  qr.image(req.query.baseUrl + 'verify/' + token, { margin: 0 }).pipe(res);
});

app.get('/verify/:token', (req, res) => {
  const isValid = speakeasy.totp.verify({
    secret: secret.base32,
    encoding: 'base32',
    step: 30,
    window: 1,
    token: req.params.token
  });

  res.send(isValid);
});

module.exports = app;
