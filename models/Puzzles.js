module.exports = function(sequelize, DataTypes) {
  const Puzzles = sequelize.define("Puzzles", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    puzzle_id: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    puzzle_name: { type: DataTypes.STRING, allowNull: false },
    piece_count: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      defaultValue: 500
    },
    notes: { type: DataTypes.TEXT },
    year: { type: DataTypes.STRING },
    image_box_front: { type: DataTypes.STRING },
    image_box_back: { type: DataTypes.STRING }, 
    image_complete: { type: DataTypes.STRING },
    in_collection: { type: DataTypes.BOOLEAN, defaultValue: false },
    is_complete: { type: DataTypes.BOOLEAN },
    how_acquired: { type: DataTypes.STRING, allowNull: true },
    // The Collector's "Pulse"
    availability_index: { 
      type: DataTypes.DECIMAL(5, 2), 
      defaultValue: 0.00 
    },
    availability_check_count: { 
      type: DataTypes.INTEGER, 
      defaultValue: 0 
    },
    availability_found_count: { type: DataTypes.INTEGER },
  });

  return Puzzles;
};