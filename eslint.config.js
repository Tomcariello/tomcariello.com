const airbnbBase = require('eslint-config-airbnb-base');

module.exports = [
  {
    // Ignore these folders entirely
    ignores: ["node_modules/**", "public/**"],
  },
  {
    // Match everything ending in .js in the root and all subfolders
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        require: "readonly",
        module: "readonly",
        __dirname: "readonly",
        process: "readonly",
        console: "readonly",
        // Add Express/Mocha/Jest globals if you use them
      },
    },
    rules: {
      ...airbnbBase.rules,
      "no-console": "off",
      "comma-dangle": "off",
      "consistent-return": "off",
      "no-unused-vars": "warn",
      "no-var": "error",
      "prefer-const": "error"
    },
  }
];