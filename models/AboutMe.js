'use strict';

module.exports = (sequelize, DataTypes) => {
  const AboutMe = sequelize.define('AboutMe', {
    bio: DataTypes.TEXT,
    caption: DataTypes.STRING,
    image: DataTypes.STRING,
    
    aboutpageimage: DataTypes.STRING,
    aboutpagecaption: DataTypes.STRING,
    aboutpagetext: DataTypes.TEXT
  }, {
    freezeTableName: true
  });

  return AboutMe;
};