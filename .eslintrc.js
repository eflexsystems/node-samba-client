module.exports = {
  env: {
    browser: false,
    node: true,
    commonjs: true,
    es2021: true,
  },
  extends: ["standard", "prettier", "plugin:n/recommended"],
  parserOptions: {
    ecmaVersion: 2020,
  },
  rules: {},
};
