'use strict';
module.exports = function(sequelize, DataTypes) {
  var AboutMe = sequelize.define('AboutMe', {
    bio: DataTypes.STRING,
    caption: DataTypes.STRING,
    image: DataTypes.STRING,
    aboutpageimage: DataTypes.STRING,
    aboutpagecaption: DataTypes.STRING,
    aboutpagetext: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
      }
    },
  freezeTableName: true
  });
  return AboutMe;
};