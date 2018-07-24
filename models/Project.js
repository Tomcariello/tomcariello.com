'use strict';
module.exports = function(sequelize, DataTypes) {
  var Project = sequelize.define('Project', {
    ProjectName: DataTypes.STRING,
    ProjectBlurb: DataTypes.STRING,
    ProjectURL: DataTypes.STRING,
    GithubURL: DataTypes.STRING,
    ProjectIMG: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
      }
    }
  });
  return Project;
};