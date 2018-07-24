var bcrypt = require('bcrypt');

'use strict';
module.exports = function(sequelize,DataTypes) {
  var users = sequelize.define('users', {
    firstname: DataTypes.STRING,
    lastname: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
      }
  }
});

users.generateHash = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(9), null);
}

users.validatePassword = function(userProvidedPassword, databasePassword) {
    return bcrypt.compareSync(userProvidedPassword, databasePassword)
}

return users;

};