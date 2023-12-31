const jwt = require('jsonwebtoken');

// set token secret and expiration date
const secret = 'mysecretsshhhhh';
const expiration = '30d';

module.exports = {
  // function for our authenticated routes
  authMiddleware: function ({req}) {
    // allows token to be sent via  req.query or headers
    let token = req.body.token || req.query.token ||req.headers.authorization;

    // ["Bearer", "<tokenvalue>"]
    if (req.headers.authorization) {
      token = token.split(' ').pop().trim();
    }

    if (!token) {
      return;
    }

    // verify token and get user data out of it
try {
  const { data } = jwt.verify(token, secret, { maxAge: expiration });
  req.user = data;
} catch (error) {
  console.error('Invalid token:', error.message);
  return res.status(401).json({ message: 'Invalid token' });
}


    // send to next endpoint
    return req
  },
  signToken: function ({ username, email, _id }) {
    const payload = { username, email, _id };

    return jwt.sign({ data: payload }, secret, { expiresIn: expiration });
  },
};
