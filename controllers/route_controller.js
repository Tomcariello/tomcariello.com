const express = require('express');
const passport = require('passport');
const multer = require('multer');
const fs = require('fs');
// const aws = require('aws-sdk');
const { Upload } = require("@aws-sdk/lib-storage");
const { S3Client } = require('@aws-sdk/client-s3');
const path = require('path');
const models = require('../models');
const transporter = require('../config/transporter.js');
const { Op } = require("sequelize");

const router = express.Router();
// const sequelizeConnection = models.sequelize;
const multerUpload = multer({ dest: path.join(__dirname, '/public/images/') });

// amazon S3 configuration
const { S3_BUCKET } = process.env;
const S3AccessKeyId = process.env.AWS_ACCESS_KEY_ID;
const S3SecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;


// route middleware to make sure user is verified
function isLoggedIn(req, res, next) {
  // if user is authenticated in the session, carry on
  let loginCheckAction;
  if (req.isAuthenticated()) {
    loginCheckAction = next();
  } else {
    loginCheckAction = res.redirect('/');
  }
  return loginCheckAction;
}

function sendAutomaticEmail(mailOptions) {
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error, info);
    }
  });
}

// Check Administrator status and add to object
function checkAdminStatus(req, payload) {
  if (req.user) {
    // attach it to the payload object
    payload.administrator = true; 
    
    // Some older workflows might look for it inside the data array too
    // Deprecate this approach until all routes are modernized
    if (Array.isArray(payload.dynamicData)) {
       payload.dynamicData.administrator = true;
    }
  }
  return payload;
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  followRegionRedirects: true,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  endpoint: "https://s3.us-east-1.amazonaws.com", 
  forcePathStyle: true, 
  apiVersion: 'latest'
});

const uploadToS3 = async (fileName, filePath, fileType) => {
  try {
    const fileBuffer = fs.readFileSync(filePath);

    const parallelUploads3 = new Upload({
      client: s3Client,
      params: {
        Bucket: process.env.S3_BUCKET,
        Key: fileName,
        Body: fileBuffer,
        ContentType: fileType,
        ACL: 'public-read',
      },
    });

    const result = await parallelUploads3.done();

    // 3. Cleanup local disk
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return result.Location;
  } catch (err) {
    console.error("S3 Upload Error:", err);
    throw err;
  }
};

// ==================================
// =====GET routes to load pages=====
// ==================================
router.get('/', (req, res) => {
  res.redirect('/index');
});

router.get('/vi', (req, res) => {
  res.render('vi');
});

router.get('/index', (req, res) => {
  // Query database for page information
  models.AboutMe.findOne({
    where: { id: 1 },
  })
    .then((data) => {
      data = data.toJSON();
      const payload = { dynamicData: data };

      // Check if user is logged in
      checkAdminStatus(req, payload);

      res.render('index', { 
        dynamicData: payload.dynamicData, 
        // layout: 'main-social' 
        layout: 'main' 
      });
    });
});

router.get('/portfolio', (req, res) => {
  // get data from projects table & sort it newest first
  models.Project.findAll({ order: [['id', 'DESC']] })
    .then((data) => {
      data = JSON.stringify(data);
      data = JSON.parse(data);

      const payload = { dynamicData: data };
      checkAdminStatus(req, payload);
      res.render('portfolio', { dynamicData: payload.dynamicData });
    });
});

router.get("/puzzles", (req, res) => {
  models.Puzzles.findAll({
   where: {
      piece_count: 500,
      year: {
        [Op.between]: [1985, 1986]
      }
    },
    // limit: 50, // Keeping your limit for performance
    order: [['year', 'ASC'], ['id', 'ASC']]
  }).then((dbPuzzles) => {
    // Map the Sequelize objects to plain JSON for Handlebars
    const puzzles = dbPuzzles.map(puzzle => puzzle.get({ plain: true }));

    res.render("puzzles", {
      puzzles: puzzles,
      s3Base: "https://tomcarielloimages.s3.amazonaws.com/puzzle_images/"
    });
  })
  .catch(err => {
    console.log(err);
    res.status(500).send("Error retrieving puzzles");
  });
});

// router.get('/contact', (req, res) => {
//   const payload = {
//     dynamicData: {
//       messageSent: false,
//     },
//   };

//   checkAdminStatus(req, payload);

//   // Add messageSent credential to the created object
//   if (req.session.messageSent) {
//     payload.dynamicData.messageSent = true;
//     req.session.messageSent = false;
//   }

//   res.render('contact', { dynamicData: payload.dynamicData, layout: 'main' });
// });

// Registration page. Disabled since no more registrations are required
router.get('/register', (req, res) => {
  // res.render('register');
  res.redirect('/index');
});

router.get('/login', (req, res) => {
  res.render('login');
});

// ============================================
// =====GET PROTECTED routes to load pages=====
// ============================================
router.get('/adminportal', isLoggedIn, (req, res) => {
  res.render('adminportal');
});

router.get('/viewmessages', isLoggedIn, async (req, res) => {
  try {
    const messages = await models.Messages.findAll({
      order: [['createdAt', 'DESC']]
    });

    const cleanMessages = messages.map(msg => msg.get({ plain: true }));

    const payload = { dynamicData: cleanMessages };
    checkAdminStatus(req, payload);

    res.render('viewmessages', { dynamicData: payload.dynamicData });

  } catch (err) {
    console.error("Error loading messages:", err);
    res.status(500).render('error', { 
      message: "Could not retrieve messages.", 
      error: err 
    });
  }
});

router.get('/adminaboutme', isLoggedIn, async (req, res) => {
  try {
    const data = await models.AboutMe.findOne({ where: { id: 1 } });
    const payload = { dynamicData: data?.get({ plain: true }) };
    
    checkAdminStatus(req, payload);
    res.render('adminaboutme', { dynamicData: payload.dynamicData });
  } catch (err) {
    res.status(500).render('error', { error: err });
  }
});

router.get('/adminportfolio', isLoggedIn, async (req, res) => {
  try {
    // pull portfolio/project data from database
    const projects = await models.Project.findAll();
    const plainProjects = projects.map(project => project.get({ plain: true }));
    let payload = { dynamicData: plainProjects };
    payload = checkAdminStatus(req, payload);
    res.render('adminportfolio', { 
      dynamicData: payload.dynamicData,
      isAdmin: payload.isAdmin // Pass this explicitly if your helper sets it
    });
  } catch (err) {
    console.error("Error loading admin portfolio:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Delete Portfolio Project
router.get('/deleteportfolioproject/:projectid', isLoggedIn, (req, res) => {
  // Use Sequelize to find the relevant DB object
  models.Project.findOne({ where: { id: req.params.projectid } })
    .then((project) => {
      // Delete the object
      project.destroy();
    }).then(() => {
      res.redirect('../adminportfolio');
    });
});

// Delete Message
router.get('/deletemessage/:messageId', isLoggedIn, (req, res) => {
  // Use Sequelize to find the relevant DB object
  models.Messages.findOne({ where: { id: req.params.messageId } })
    .then((message) => {
      // Delete the object
      message.destroy();
    }).then(() => {
      res.redirect('../viewmessages');
    });
});

// ===============================================
// =====POST routes to record to the database=====
// ===============================================

// Process registration requests using Passport
router.post('/register', passport.authenticate('local-signup', {
  successRedirect: ('../adminportal'), // if authenticated, proceed to adminportal page
  failureRedirect: ('login'), // if failed, redirect to login page (consider options here!!)
}));

// Process login requests with Passport
router.post('/login', passport.authenticate('local-login', {
  successRedirect: ('../adminportal'), // if login successful, proceed to adminportal page
  failureRedirect: ('login'), // if failed, redirect to login page (consider options here!!)
}));

// Process new portfolio object requests
router.post('/newportfolio', isLoggedIn, multerUpload.single('portfoliopicture'), async (req, res) => {
  const currentDate = new Date();

  try {
    let portfolioImagePath = null;

    if (req.file) {
      portfolioImagePath = await uploadToS3(
        req.file.originalname, 
        req.file.path, 
        req.file.mimetype
      );
    }

    await models.Project.create({
      ProjectName: req.body.NewProjectName,
      ProjectBlurb: req.body.NewProjectBlurb,
      ProjectURL: req.body.NewProjectURL,
      GithubURL: req.body.NewGithubURL,
      ProjectIMG: portfolioImagePath,
      createdAt: currentDate,
      updatedAt: currentDate,
    });

    res.redirect('../adminportfolio');

  } catch (err) {
    console.error("Error in newportfolio route:", err);
    res.status(500).send("Failed to create new project.");
  }
});

// router.post('/contact/message', (req, res) => {
//   const currentDate = new Date();

//   // Use Sequelize to push to DB
//   models.Messages.create({
//     name: req.body.fname,
//     email: req.body.email,
//     message: req.body.message,
//     createdAt: currentDate,
//     updatedAt: currentDate,
//   }).then(() => {
//     // Send email to alert the admin that a message was recieved
//     const mailOptions = {
//       from: 'contact@tomcariello.com', // sender address
//       to: 'tomcariello@gmail.com', // list of receivers
//       subject: 'Someone left you a message', // Subject line
//       text: `Name: ${req.body.fname} \n Message: ${req.body.message}`,
//     };

//     sendAutomaticEmail(mailOptions);
//     req.session.messageSent = true;

//     res.redirect('../contact');
//   });
// });

// Process portfolio update requests
router.post('/updateportfolio/:portfolioId', isLoggedIn, multerUpload.single('portfoliopicture'), async (req, res) => {
  try {
    const { portfolioId } = req.params;
    
    // 1. Handle the dynamic naming from your EJS template
    // Your template uses name="ProjectIMG{{this.id}}"
    const existingImageFieldName = `ProjectIMG${portfolioId}`;
    let portfolioImagePath = req.body[existingImageFieldName];

    // 2. Handle New Image Upload
    if (req.file) {
      portfolioImagePath = await uploadToS3(
        req.file.originalname,
        req.file.path,
        req.file.mimetype
      );
    }

    // 3. Update Database
    const project = await models.Project.findOne({ where: { id: portfolioId } });

    if (!project) {
      return res.status(404).send("Project not found.");
    }

    await project.update({
      ProjectName: req.body.ProjectName,
      // Your EJS uses name="ProjectBlurb{{this.id}}"
      ProjectBlurb: req.body[`ProjectBlurb${portfolioId}`], 
      ProjectURL: req.body.ProjectURL,
      GithubURL: req.body.GithubURL,
      ProjectIMG: portfolioImagePath,
      updatedAt: new Date(),
    });

    res.redirect('../adminportfolio');

  } catch (err) {
    console.error("Portfolio Update Error:", err);
    res.status(500).send("Failed to update portfolio.");
  }
});

// Create variable to simplify the updateAboutMe post route
const fileUpload = multerUpload.fields([{ name: 'profilepicture', maxCount: 1 }, { name: 'aboutpagepicture', maxCount: 8 }]);

// Process portfolio update requests
router.post('/updateAboutMe', isLoggedIn, fileUpload, async (req, res) => {
  try {
    const currentDate = new Date();
    
    // 1. Fetch current data to preserve existing images if no new ones are uploaded
    const aboutMe = await models.AboutMe.findOne({ where: { id: 1 } });
    if (!aboutMe) return res.status(404).send("About Me record not found.");

    // 2. Initialize image paths with current values
    let profileImagePath = aboutMe.image;
    let aboutPageImagePath = aboutMe.aboutpageimage;

    // 3. Handle Profile Picture Upload (if provided)
    if (req.files?.profilepicture) {
      const file = req.files.profilepicture[0];
      profileImagePath = await uploadToS3(file.originalname, file.path, file.mimetype);
    }

    // 4. Handle About Page Picture Upload (if provided)
    if (req.files?.aboutpagepicture) {
      const file = req.files.aboutpagepicture[0];
      aboutPageImagePath = await uploadToS3(file.originalname, file.path, file.mimetype);
    }

    // 5. Update everything in one single Database call
    await aboutMe.update({
      bio: req.body.AboutMe,
      caption: req.body.AboutMeCaption,
      image: profileImagePath,
      aboutpagetext: req.body.AboutPage,
      aboutpagecaption: req.body.AboutPageCaption,
      aboutpageimage: aboutPageImagePath,
      updatedAt: currentDate,
    });

    res.redirect('../adminaboutme');

  } catch (err) {
    console.error("Error updating About Me:", err);
    res.status(500).send("Update failed.");
  }
});

// router.post('/contact/message', (req, res) => {
//   const currentDate = new Date();

//   // Use Sequelize to push to DB
//   models.Messages.create({
//     name: req.body.fname,
//     email: req.body.email,
//     message: req.body.message,
//     createdAt: currentDate,
//     updatedAt: currentDate,
//   }).then(() => {
//     // Send email to alert the admin that a message was recieved
//     const mailOptions = {
//       from: 'contact@tomcariello.com', // sender address
//       to: 'tomcariello@gmail.com', // list of receivers
//       subject: 'Someone left you a message', // Subject line
//       text: `Name: ${req.body.fname} \n Message: ${req.body.message}`,
//     };

//     sendAutomaticEmail(mailOptions);
//     req.session.messageSent = true;

//     res.redirect('../contact');
//   });
// });

router.isLoggedIn = isLoggedIn;
router.checkAdminStatus = checkAdminStatus;
router.uploadToS3 = uploadToS3;

module.exports = router
