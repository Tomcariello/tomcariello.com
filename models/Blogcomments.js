'use strict';

module.exports = (sequelize, DataTypes) => {
  const Blogcomments = sequelize.define('Blogcomments', {
    blogid: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    commentheadline: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    commenttext: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    commentauthor: {
      type: DataTypes.STRING,
      defaultValue: 'Anonymous',
    },
  }, {
    freezeTableName: true,
  });

Blogcomments.associate = (models) => {
    if (models.Blogs) {
      Blogcomments.belongsTo(models.Blogs, { foreignKey: 'blogid' });
    }
  };

  return Blogcomments;
};
