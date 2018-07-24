'use strict';
module.exports = function(sequelize, DataTypes) {
  var Blogcomments = sequelize.define('Blogcomments', {
    blogid: DataTypes.INTEGER,
    commentheadline: DataTypes.STRING,
    commenttext: DataTypes.STRING,
    commentauthor: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
      }
    },
  freezeTableName: true
  });
  return Blogcomments;
};

