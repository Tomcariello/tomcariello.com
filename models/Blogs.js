'use strict';
module.exports = function(sequelize, DataTypes) {
  var Blogs = sequelize.define('Blogs', {
    headline: DataTypes.STRING,
    blogtext: DataTypes.STRING,
    blogimage: DataTypes.STRING,
    imagecaption: DataTypes.STRING,
    author: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
      }
    },
  freezeTableName: true
  });
  return Blogs;
};

