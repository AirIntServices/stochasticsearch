const returnOk = async () => 'Ok';

const returnSecretEnv = async () => process.env.MY_SECRET_VARIABLE;

module.exports = {
  returnOk,
  returnSecretEnv,
};
