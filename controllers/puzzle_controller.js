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
module.exports = router;