const router = require('express').Router();
const actions = require('./actions.js');

router.get('/status', (req, res) => {
  res.json({ message: 'API OK' });
});

router.get('/test', (req, res) => {
  const login = req.query.login;
  res.json({login});
})

actions.create(router);

module.exports = router;
