const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const Auth = require('./middleware/auth');
const cookieParser = require('./middleware/cookieParser');
const models = require('./models');
const verifySession = require('./middleware/verifySession');
const app = express();


app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(cookieParser);
app.use(Auth.createSession);
//app.use(verifySession.verify);
// app.use((req, res, next) => {
//   console.log(req.originalUrl);
//   next();
// });
//app.use((req, res, next) => { console.log(req.headers.Cookie); next(); });


app.get('/',
  (req, res) => {
    verifySession.verify(req, res);
    res.render('index');
  });

app.get('/signup',
  (req, res) => {
    res.render('signup');
  });

app.get('/login',
  (req, res) => {
    res.render('login');
  });

app.get('/create',
  (req, res) => {
    verifySession.verify(req, res);
    res.render('index');
  });

app.get('/links',
  (req, res, next) => {
    verifySession.verify(req, res);
    models.Links.getAll()
      .then(links => {
        res.status(200).send(links);
      })
      .error(error => {
        res.status(500).send(error);
      });
  });

app.post('/links',
  (req, res, next) => {
    var url = req.body.url;
    if (!models.Links.isValidUrl(url)) {
      // send back a 404 if link is not valid
      return res.sendStatus(404);
    }

    return models.Links.get({ url })
      .then(link => {
        if (link) {
          throw link;
        }
        return models.Links.getUrlTitle(url);
      })
      .then(title => {
        return models.Links.create({
          url: url,
          title: title,
          baseUrl: req.headers.origin
        });
      })
      .then(results => {
        return models.Links.get({ id: results.insertId });
      })
      .then(link => {
        throw link;
      })
      .error(error => {
        res.status(500).send(error);
      })
      .catch(link => {
        res.status(200).send(link);
      });
  });

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.post('/login', (req, res) => {
  return models.Users.get({'username': req.body.username})
    .then((user) => {
      if (models.Users.compare(req.body.password, user.password, user.salt)) {
        models.Sessions.update(req.session.id, { userId: user.id });
        res.redirect('/');
      } else {
        res.redirect('/login');
      }
    })
    .catch(err => res.redirect('/login'));
});

app.post('/signup', (req, res) => {
  //console.log(req.body, res.body);
  var user = {};
  user.username = req.body.username;
  user.password = req.body.password;
  models.Users.create(user).then((user) => {
    models.Sessions.update({ hash: req.session.hash }, { userId: user.insertId });
    res.redirect('/');
  }).catch(err=> {
    res.redirect('/signup');
  });
});

app.get('/logout', (req, res) => {
  //take the hash 'shortly id' from the request object
  res.clearCookie('shortlyid');
  models.Sessions.delete({ hash: req.cookies.shortlyid });
  //use the hash to delete the session that corresponds to it from the sessions table
  models.Sessions.create()
    .then( (insQuery) => {
      return models.Sessions.get({ id: insQuery.insertId });
    })
    .then( (session) => {
      req.session = session;
      res.cookie('shortlyid', `${session.hash}`);
      res.redirect('/login');
    })
    .catch(err => console.log(err));
  //remove the cookies from the response object

});

/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {

  return models.Links.get({ code: req.params.code })
    .tap(link => {

      if (!link) {
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap(link => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      res.redirect('/');
    });
});

module.exports = app;
