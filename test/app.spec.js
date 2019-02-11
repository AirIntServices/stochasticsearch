require('dotenv').config({ path: './config/env' });
const chai = require('chai');
const app = require('../app/app');

chai.should();

describe('App', async () => {
  describe('returnOk', async () => {
    it('returns "Ok"', async () => {
      const res = await app.returnOk();
      res.should.equal('Ok');
    });
  });

  describe('returnSecretEnv', async () => {
    it('returns MY_SECRET_VARIABLE environment variable', async () => {
      const res = await app.returnSecretEnv();
      res.should.equal(process.env.MY_SECRET_VARIABLE);
    });
  });
});
