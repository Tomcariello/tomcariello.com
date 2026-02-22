'use strict';

module.exports = (sequelize, DataTypes) => {
  const Messages = sequelize.define('Messages', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    freezeTableName: true
  });

  return Messages;
};