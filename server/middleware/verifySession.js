const models = require('../models');
const promise = require('bluebird');

module.exports.verifySession = (req, res, next) => {
  //receive request and see if a session has been established
  //read the user who sent the request and verify that they are logged in
  models.Session.isLoggedIn();
  //if they are associate the user with the session
  //
};