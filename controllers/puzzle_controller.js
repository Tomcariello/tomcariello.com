const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const models = require('../models/index.js');
const mainRouter = require('./route_controller');

const isLoggedIn = mainRouter.isLoggedIn;
const checkAdminStatus = mainRouter.checkAdminStatus;
const uploadToS3 = mainRouter.uploadToS3;
const s3Client = mainRouter.s3Client

const router = express.Router();
const multerUpload = multer({ dest: path.join(__dirname, '/public/images/') });
const s3BaseUrl = "https://tomcarielloimages.s3.amazonaws.com/puzzle_images/";

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
      s3Base: s3BaseUrl
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

// Using the database primary key as the puzzle_id is not guaranteed unique
router.get('/editpuzzle/:dbId', isLoggedIn, async (req, res) => {
  try {
    const dbId = req.params.dbId;
    if (!dbId) {
      return res.redirect('/adminpuzzles');
    }

    const puzzle = await models.Puzzles.findOne({
      where: { id: dbId },
    });

    if (!puzzle) {
      console.error('Puzzle not found in database.')
      return res.redirect('/adminpuzzles');
    }

    const cleanPuzzle = puzzle.get({ plain: true });

    const payload = {
      dynamicData: cleanPuzzle,
    };

    checkAdminStatus(req, payload);
    payload.dynamicData.s3Base = s3BaseUrl

    res.render('adminpuzzles-edit', payload);

  } catch (err) {
    console.error("Error loading edit puzzle page:", err);
    res.status(500).render('error', {
      message: "An error occurred while trying to load the puzzle for editing.",
      error: err
    });
  }
});

// Multer config for puzzle image upload
const puzzleUpload = multerUpload.fields([
  { name: 'image_box_front', maxCount: 1 },
  { name: 'image_box_back', maxCount: 1 },
  { name: 'image_complete', maxCount: 1 }
]);

router.post('/updatepuzzle/:dbId', isLoggedIn, puzzleUpload, async (req, res) => {
  try {
    const dbId = req.params.dbId;

    const puzzle = await models.Puzzles.findOne({ where: { id: dbId } });
    if (!puzzle) return res.status(404).send("Puzzle not found.");

    // We use the puzzle_id from the FORM (body) in case the admin just changed it
    const puzzleId = puzzle.puzzle_id || 'unknown';

    let frontPath = puzzle.image_box_front;
    let backPath = puzzle.image_box_back;
    let completePath = puzzle.image_complete;
    let frontImageName = puzzle.image_box_front;
    let backImageName = puzzle.image_box_back;
    let completeImageName = puzzle.image_complete;

    const generateS3FileName = (file, suffix) => {
      const fileExt = path.extname(file.originalname);
      return `${dbId}_${puzzleId}_${suffix}${fileExt}`;
    };

    // Normalize image names prior to upload
    if (req.files?.image_box_front) {
      const file = req.files.image_box_front[0];
      frontImageName = generateS3FileName(file, 'front');
      frontPath = await uploadToS3(`puzzle_images/${frontImageName}`, file.path, file.mimetype);
    }

    if (req.files?.image_box_back) {
      const file = req.files.image_box_back[0];
      backImageName = generateS3FileName(file, 'back');
      backPath = await uploadToS3(`puzzle_images/${backImageName}`, file.path, file.mimetype);
    }

    if (req.files?.image_complete) {
      const file = req.files.image_complete[0];
      completeImageName = generateS3FileName(file, 'complete');
      completePath = await uploadToS3(`puzzle_images/${completeImageName}`, file.path, file.mimetype);
    }

    let isCompleteValue;
    if (req.body.is_complete === "1") {
        isCompleteValue = true;
    } else if (req.body.is_complete === "0") {
        isCompleteValue = false;
    } else {
        isCompleteValue = null; // Represents "Unknown"
    }

    await puzzle.update({
      puzzle_name: req.body.puzzle_name,
      year: req.body.year || null,
      piece_count: req.body.piece_count ? parseInt(req.body.piece_count, 10) : null,
      notes: req.body.notes,
      in_collection: req.body.in_collection === 'on',
      is_complete: isCompleteValue,
      how_acquired: req.body.how_acquired,
      image_box_front: frontImageName,
      image_box_back: backImageName,
      image_complete: completeImageName,
      updatedAt: new Date(),
    });

    res.redirect('/adminpuzzles');

  } catch (err) {
    console.error("Error updating Puzzle:", err);
    res.status(500).send("Update failed.");
  }
});

router.post('/delete-puzzle-image/:dbId', isLoggedIn, async (req, res) => {
  try {
    const { dbId } = req.params;
    const { fieldName, fileName } = req.body;

    const deleteParams = {
      Bucket: process.env.S3_BUCKET,
      Key: `puzzle_images/${fileName}`
    };

    const command = new DeleteObjectCommand(deleteParams);
    await s3Client.send(command);

    console.log(`Successfully deleted ${fileName} from S3`);

    const updateObject = {};
    updateObject[fieldName] = "";

    await models.Puzzles.update(updateObject, {
      where: { id: dbId }
    });

    res.sendStatus(200);
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ error: "Failed to delete image" });
  }
});

module.exports = router;