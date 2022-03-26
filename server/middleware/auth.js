const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  //access the parsed cookies on the req
  if (Object.keys(req.cookies).length === 0) {
    return models.Sessions.create()
      .then( InsQuery => {
        let options = {
          id: InsQuery.insertId
        };
        return models.Sessions.get(options);
      })
      .then( session => {
        req.session = session;
        res.cookies.shortlyid = { value: session.hash };
        next();
      })
      .catch(err => console.log(err));
  } else if (Object.keys(req.cookies).length !== 0) {
    // get cookie from request through dot access

    // check if the cookie corresponds to a session
    models.Sessions.get({ hash: req.cookies.shortlyid })
      .then(session => {
        req.session = session;
        next();
      })
      .catch( err => models.Sessions.create() )
      .then(InsQuery => {
        console.log(InsQuery);
        let options = {
          id: InsQuery.insertId
        };
        return models.Sessions.get(options);
      })
      .then( session => {
        console.log(session);
        req.session = session;
        res.cookies.shortlyid = { value: session.hash };
        next();
      })
      .catch(err => console.log(err));
    // create a new session and a new cookie
    // attach the session to the new cookie?
    // res.cookie get update with the new cookie
    //if it does, attach the session to the request
  }

  //if theres no cookies create a new session, store in table with sessions create method
  //if cookies exist (Object.keys of req.cookies length is not zero) so we look them up in the database and update req.session
  // if user is there, we include the updated session in the object
  // if there's not a matching session to the cookie
  // do something, maybe create a new session?

};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

