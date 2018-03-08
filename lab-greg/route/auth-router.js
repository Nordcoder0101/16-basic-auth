'use strict';

const jsonParser = require('body-parser').json();
const debug = require('debug')('cfgram:auth-router');
const Router = require('express').Router;
const createErrors = require('http-errors');
const basicAuth = require('../lib/basic-auth-middleware.js');
const User = require('../model/user.js');

const authRouter = module.exports = Router();

authRouter.post('/api/signup', jsonParser, function(req, res, next) {
  debug('POST: /api/signup');

  if(!req.body.password || !req.body.username || !req.body.email) {
    return next(createErrors(400, 'you did not provide a password, username, or email'));
  } 

  let password = req.body.password;
  delete req.body.password;

  let user = new User(req.body);
  console.log(user);
  user.generatePasswordHash(password)
    .then( user => user.save())
    .then( user => user.generateToken())
    .then( token => res.send(token))
    .catch(next);
});

authRouter.get('/api/signin', basicAuth, function(req, res, next) {
  debug('GET: /api/signin');

  User.findOne({ username: req.auth.username })
    .then( user => user.comparePasswordHash(req.auth.password))
    .then( user => user.generateToken())
    .then( token => res.send(token))
    .catch(next);
});