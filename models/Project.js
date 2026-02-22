'use strict';

module.exports = (sequelize, DataTypes) => {
  const Project = sequelize.define('Project', {
    ProjectName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    ProjectBlurb: {
      type: DataTypes.TEXT
    },
    ProjectURL: {
      type: DataTypes.STRING,
      validate: { isUrl: true }
    },
    GithubURL: {
      type: DataTypes.STRING,
      validate: { isUrl: true }
    },
    ProjectIMG: {
      type: DataTypes.STRING
    }
  });

  return Project;
};