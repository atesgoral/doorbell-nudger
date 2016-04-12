'use strict';

const express = require('express');
const speakeasy = require('speakeasy');
const qr = require('qr-image');
const Twitter = require('twitter');

const app = express();

const secret = speakeasy.generateSecret();

const client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

app.use('/', express.static(__dirname + '/static'));

app.get('/qrcode', (req, res) => {
  const token = speakeasy.totp({
    secret: secret.base32,
    encoding: 'base32',
    step: 30
  });

  res.cookie('token', token);

  qr.image(req.query.baseUrl + 'verify/' + token, { margin: 0, size: 10 }).pipe(res);
});

app.get('/verify/:token', (req, res) => {
  console.log('Got token:', req.params.token);

  const isValid = speakeasy.totp.verify({
    secret: secret.base32,
    encoding: 'base32',
    step: 30,
    window: 1,
    token: req.params.token
  });

  if (isValid) {
    console.log('Token is valid');

    client.post('statuses/update', { status: '@DoorbellRinger #ringit' + Date.now() }, (error, tweet, response) => {
      if (error) {
        console.error('Tweet failed', error);
      } else {
        console.log('Tweeted!');
      }
    });
  } else {
    console.log('Token is invalid');
  }

  res.send(isValid);
});

module.exports = app;
