const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const models = require('../models/index.js');
const mainRouter = require('./route_controller');

const isLoggedIn = mainRouter.isLoggedIn;
const checkAdminStatus = mainRouter.checkAdminStatus;
const uploadToS3 = mainRouter.uploadToS3;

const router = express.Router();
const multerUpload = multer({ dest: path.join(__dirname, '/public/images/') });

const isAdminMiddleware = (req, res, next) => {
  // Passport attaches the user to req.user
  if (req.isAuthenticated() && req.user.administrator === true) {
    return next();
  }

  // Debugging: If it fails, let's see why in the terminal
  console.log("--- Admin Access Denied ---");
  console.log("User Object:", req.user); 
  
  res.status(403).send("Unauthorized: You must be an administrator to access this page.");
};

router.get("/puzzles", (req, res) => {
  models.Puzzles.findAll({
    // Explicitly listing fields keeps the transfer size small
    attributes: [
      'id', 
      'puzzle_id', 
      'puzzle_name', 
      'piece_count', 
      'year', 
      'image_box_front', 
      'image_box_back',
      'image_complete',
      'notes',         
      'in_collection', 
      'is_complete', 
      'how_acquired'
    ],
    // We'll let the user filter everything, so we remove the 'where'
    order: [['year', 'ASC'], ['puzzle_name', 'ASC']]
  }).then((dbPuzzles) => {
    const puzzles = dbPuzzles.map(puzzle => puzzle.get({ plain: true }));

    res.render("puzzles", {
      puzzles: puzzles,
      // Keeping your S3 base for the image helper
      s3Base: "https://tomcarielloimages.s3.amazonaws.com/puzzle_images/"
    });
  })
  .catch(err => {
    console.error("Database Error:", err);
    res.status(500).render("error", { message: "Could not load the archive." });
  });
});

router.get('/adminpuzzles', async (req, res) => {
  try {
    const data = await models.Puzzles.findAll({ order: [['createdAt', 'DESC']] });
    const plainPuzzles = data.map(p => p.get({ plain: true }));

    const payload = { dynamicData: plainPuzzles };
    checkAdminStatus(req, payload);

    res.render('adminpuzzles', { 
      puzzles: payload.dynamicData, 
      dynamicData: payload.dynamicData 
    });

  } catch (error) {
    console.error("Error fetching puzzles:", error);
    res.status(500).send("Check terminal logs");
  }
});

// Define the three specific fields we expect from the admin puzzle form
const puzzleImageUploads = multerUpload.fields([
  { name: 'image_box_front', maxCount: 1 },
  { name: 'image_box_back', maxCount: 1 },
  { name: 'image_complete', maxCount: 1 }
]);

// 1. THE GET ROUTE: Loads the edit page for a specific puzzle
// router.get('/adminpuzzles/edit/:id', isLoggedIn, checkAdminStatus, async (req, res) => {
//   try {
//     // Find the puzzle in the DB using the ID from the URL (/edit/45)
//     const puzzle = await models.Puzzles.findByPk(req.params.id);
    
//     if (!puzzle) {
//       return res.status(404).send("That puzzle doesn't exist in the archive.");
//     }

//     // Render the edit handlebars file and pass the puzzle data to it
//     res.render('adminpuzzles-edit', {
//       puzzle: puzzle.get({ plain: true }),
//       // Pass your S3 base URL so the image previews work
//       s3Base: "https://tomcarielloimages.s3.amazonaws.com/puzzle_images/"
//     });
    
//   } catch (err) {
//     console.error("Error loading edit page:", err);
//     res.status(500).send("Server error while trying to open the edit form.");
//   }
// });

router.post('/adminpuzzles/update/:id', isLoggedIn, checkAdminStatus, puzzleImageUploads, async (req, res) => {
  try {
    const puzzleId = req.params.id;
    const existingPuzzle = await models.Puzzles.findByPk(puzzleId);

    if (!existingPuzzle) return res.status(404).send("Puzzle not found");

    // Start with the text/checkbox data
    const updateData = {
      puzzle_name: req.body.puzzle_name,
      year: req.body.year,
      piece_count: req.body.piece_count,
      in_collection: req.body.in_collection === 'on',
      is_complete: req.body.is_complete === 'on',
      how_acquired: req.body.how_acquired,
      notes: req.body.notes
    };

    // Check for uploaded files in our 3 specific fields
    const fileFields = ['image_box_front', 'image_box_back', 'image_complete'];

    for (const fieldName of fileFields) {
      if (req.files && req.files[fieldName]) {
        const file = req.files[fieldName][0];
        
        // Strategy: Use the Puzzle ID in the filename to keep S3 clean
        // e.g., PZL4190_front_17123456.png
        const s3FileName = `${existingPuzzle.puzzle_id}_${fieldName.split('_').pop()}_${Date.now()}`;
        
        const s3Path = await uploadToS3(
          s3FileName, 
          file.path, 
          file.mimetype
        );

        // Store just the filename or the path in the DB
        updateData[fieldName] = s3FileName; 

        fs.unlink(file.path, (err) => { if (err) console.error("Local cleanup failed", err); });
      }
    }

    await models.Puzzles.update(updateData, { where: { id: puzzleId } });

    res.redirect('/adminpuzzles');

  } catch (err) {
    console.error("Error updating puzzle:", err);
    res.status(500).send("Something went wrong with the puzzle update.");
  }
});

// 1. DISPLAY THE EDIT FORM
router.get('/adminpuzzles/edit/:id', isLoggedIn, isAdminMiddleware, async (req, res) => {
  console.error('--- Route Reached! ---');
  console.error('ID:', req.params.id);
  console.error(`isLoggedIn: ${isLoggedIn}`)
  
  try {
    const puzzle = await models.Puzzles.findByPk(req.params.id);
    if (!puzzle) return res.status(404).send("Puzzle not found.");

    res.render('adminpuzzles-edit', {
      puzzle: puzzle.get({ plain: true }),
      s3Base: "https://tomcarielloimages.s3.amazonaws.com/puzzle_images/"
    });
  } catch (err) {
    console.error("Database Error:", err);
    res.status(500).send("Error loading puzzle.");
  }
});

// 2. PROCESS THE UPDATE
router.post('/adminpuzzles/update/:id', isLoggedIn, checkAdminStatus, puzzleImageUploads, async (req, res) => {
  try {
    const id = req.params.id;
    const existing = await models.Puzzles.findByPk(id);

    // Prepare the basic data
    // Remember: checkboxes only exist in req.body if they are checked ('on')
    const updateData = {
      puzzle_name: req.body.puzzle_name,
      year: parseInt(req.body.year),
      piece_count: parseInt(req.body.piece_count),
      in_collection: req.body.in_collection === 'on',
      is_complete: req.body.is_complete === 'on',
      how_acquired: req.body.how_acquired,
      notes: req.body.notes,
      updatedAt: new Date()
    };

    // Handle the 3 potential image slots
    const slots = ['image_box_front', 'image_box_back', 'image_complete'];

    for (const slot of slots) {
      if (req.files && req.files[slot]) {
        const file = req.files[slot][0];
        
        // Clean Filename: PZL4190_front.png
        const suffix = slot.split('_').pop(); // 'front', 'back', or 'complete'
        const s3Key = `${existing.puzzle_id}_${suffix}`;

        await uploadToS3(s3Key, file.path, file.mimetype);

        // Update the database field with the new key
        updateData[slot] = s3Key;

        // Cleanup local temp file
        fs.unlinkSync(file.path); 
      }
    }

    await models.Puzzles.update(updateData, { where: { id: id } });

    // Success! Send them back to the search page to find the next one
    res.redirect('/adminpuzzles?success=true');

  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).send("Failed to save changes to the archive.");
  }
});

module.exports = router;