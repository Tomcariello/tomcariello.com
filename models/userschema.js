const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  const Users = sequelize.define('users', {
    firstname: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastname: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    }
  });

  // Modern Sequelize way to add instance/class methods
  Users.generateHash = (password) => bcrypt.hashSync(password, bcrypt.genSaltSync(9));

  Users.prototype.validatePassword = function (password) {
    return bcrypt.compareSync(password, this.password);
  };

  return Users;
};