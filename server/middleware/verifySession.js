const model = require('../models');
const promise = require('bluebird');

module.exports.verify = (req, res) => {
//redirect user to login page for specified routes
  console.log(req.session);
  if (!model.Sessions.isLoggedIn(req.session)) {
    res.redirect('/login');
  }

};