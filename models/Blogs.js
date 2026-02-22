'use strict';

module.exports = (sequelize, DataTypes) => {
  const Blogs = sequelize.define('Blogs', {
    headline: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    blogtext: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    blogimage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    imagecaption: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    author: {
      type: DataTypes.STRING,
      defaultValue: 'Tom Cariello',
    }
  }, {
    freezeTableName: true,
  });

  Blogs.associate = (models) => {
    Blogs.hasMany(models.Blogcomments, {
      foreignKey: 'blogid',
      onDelete: 'CASCADE',
    });
  };

  return Blogs;
};