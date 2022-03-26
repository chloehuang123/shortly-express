const parseCookies = (req, res, next) => {
  var cookieObj = {};
  if (req.headers.cookie !== undefined) {
    var singleCookies = req.headers.cookie.split(';');
    for (var i = 0; i < singleCookies.length; i++) {
      var cookieSplit = singleCookies[i].split('=');
      cookieObj[cookieSplit[0].trim()] = cookieSplit[1];
    }
    req.cookies = cookieObj;
  }
  next();
};

module.exports = parseCookies;