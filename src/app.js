'use strict';

const express = require('express');
const auth = require('basic-auth');
const HttpStatus = require('http-status-codes');
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

function authorize(req, res, next) {
  const user = auth(req);

  if (!user || user.name !== process.env.HTTP_AUTH_USER || user.pass !== process.env.HTTP_AUTH_PASS) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Doorbell Nudger"');
    res.status(HttpStatus.UNAUTHORIZED).send('Who are you?');
  } else {
    next();
  }
}

app.get('/qrcode', authorize, (req, res) => {
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

    client.post('statuses/update', { status: `Hey @DoorbellRinger, token ${ req.params.token } is valid. #ringit` }, (error, tweet) => {
      if (error) {
        console.error('Tweet failed');
        res.status(HttpStatus.SERVICE_UNAVAILABLE).send('Tweet failed');
      } else {
        console.log('Tweet successful');
        res.redirect(`https://twitter.com/DoorbellNudger/status/${ tweet.id_str }`);
      }
    });
  } else {
    console.log('Token is invalid');
    res.redirect('/invalid.html');
  }
});

app.use('/', express.static(__dirname + '/static'));

module.exports = app;
