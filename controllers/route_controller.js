const express = require('express');
const passport = require('passport');
const multer = require('multer');
const fs = require('fs');
const aws = require('aws-sdk');
const path = require('path');
const models = require('../models');
const transporter = require('../config/transporter.js');
const { Op } = require("sequelize");

const router = express.Router();
// const sequelizeConnection = models.sequelize;
const upload = multer({ dest: path.join(__dirname, '/public/images/') });

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

// Function to upload an image to Amazon S3
const uploadToS3 = (fileName, stream, fileType) =>
  // Create a Promise to control the Async of the file upload
  new Promise((resolve, reject) => {
    // Instantiate Amazon S3 module
    const s3 = new aws.S3();

    // Create object to upload to S3
    const params = {
      Bucket: S3_BUCKET, // My S3 Bucket
      Key: fileName, // This is what S3 will use to store the data uploaded.
      Body: stream, // the actual *file* being uploaded
      ContentType: fileType, // type of file being uploaded
      ACL: 'public-read', // Set permissions so everyone can see the image
      processData: false,
      accessKeyId: S3AccessKeyId, // My Key
      secretAccessKey: S3SecretAccessKey, // My Secret Key
    };

    // Upload the object
    s3.upload(params, (err, data) => {
      if (err) {
        reject(Error('It broke'));
      } else {
        // Return the filepath to the uploaded image
        resolve(data.Location);
      }
    });
  })
;


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
        layout: 'main-social' 
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

router.get('/contact', (req, res) => {
  const payload = {
    dynamicData: {
      messageSent: false,
    },
  };

  checkAdminStatus(req, payload);

  // Add messageSent credential to the created object
  if (req.session.messageSent) {
    payload.dynamicData.messageSent = true;
    req.session.messageSent = false;
  }

  res.render('contact', { dynamicData: payload.dynamicData, layout: 'main' });
});

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
router.post('/newportfolio', isLoggedIn, (req, res) => {
  const currentDate = new Date();

  // Use Sequelize to push to DB
  models.Project.create({
    ProjectName: req.body.NewProjectName,
    ProjectBlurb: req.body.NewProjectBlurb,
    ProjectURL: req.body.NewProjectURL,
    GithubURL: req.body.NewGithubURL,
    ProjectIMG: req.body.NewProjectIMG,
    createdAt: currentDate,
    updatedAt: currentDate,
  }).then(() => {
    res.redirect('../adminportfolio');
  })
    .catch((err) => {
      // print the error details
      console.log(err);
    });
});

router.post('/contact/message', (req, res) => {
  const currentDate = new Date();

  // Use Sequelize to push to DB
  models.Messages.create({
    name: req.body.fname,
    email: req.body.email,
    message: req.body.message,
    createdAt: currentDate,
    updatedAt: currentDate,
  }).then(() => {
    // Send email to alert the admin that a message was recieved
    const mailOptions = {
      from: 'contact@tomcariello.com', // sender address
      to: 'tomcariello@gmail.com', // list of receivers
      subject: 'Someone left you a message', // Subject line
      text: `Name: ${req.body.fname} \n Message: ${req.body.message}`,
    };

    sendAutomaticEmail(mailOptions);
    req.session.messageSent = true;

    res.redirect('../contact');
  });
});

// Process portfolio update requests
router.post('/updateportfolio/:portfolioId', isLoggedIn, upload.single('portfoliopicture'), (req, res) => {
  const currentDate = new Date();

  // Retain previous image location
  const portfolioImageToUpload = req.body[`ProjectIMG ${req.params.portfolioId}`];

  // Check if any image(s) were uploaded
  if (typeof req.file !== 'undefined') {
    // Process file being uploaded
    const fileName = req.file.originalname;
    const fileType = req.file.mimetype;
    const stream = fs.createReadStream(req.file.path); // Create "stream" of the file

    uploadToS3(fileName, stream, fileType)
      .then((portfolioImagePath) => {
        // Use Sequelize to find the relevant DB object
        models.Project.findOne({ where: { id: req.params.portfolioId } })

          .then((id) => {
            // Update the data
            id.update({
              ProjectName: req.body.ProjectName,
              ProjectBlurb: req.body[`ProjectBlurb ${req.params.portfolioId}`],
              ProjectURL: req.body.ProjectURL,
              GithubURL: req.body.GithubURL,
              ProjectIMG: portfolioImagePath,
              updatedAt: currentDate,
            }).then(() => {
              res.redirect('../adminportfolio');
            });
          });
      });
  } else { // No image to upload, just update the text
    // Use Sequelize to find the relevant DB object
    models.Project.findOne({ where: { id: req.params.portfolioId } })
      .then((project) => {
        // Update the data
        project.update({
          ProjectName: req.body.ProjectName,
          ProjectBlurb: req.body[`ProjectBlurb ${req.params.portfolioId}`],
          ProjectURL: req.body.ProjectURL,
          GithubURL: req.body.GithubURL,
          ProjectIMG: portfolioImageToUpload,
          updatedAt: currentDate,
        }).then(() => {
          res.redirect('../adminportfolio');
        });
      });
  }
});

// Create variable to simplify the updateAboutMe post route
const fileUpload = upload.fields([{ name: 'profilepicture', maxCount: 1 }, { name: 'aboutpagepicture', maxCount: 8 }]);

// Process portfolio update requests
router.post('/updateAboutMe', isLoggedIn, fileUpload, (req, res) => {
  let profileImageToUpload;
  const currentDate = new Date();

  // If both images have been uploaded, procede
  if (req.files.profilepicture && req.files.aboutpagepicture) {
    // Isolate profilepicture elements
    const fileName = req.files.profilepicture[0].originalname;
    const stream = fs.createReadStream(req.files.profilepicture[0].path); // Create "stream" of the file
    const fileType = req.files.profilepicture[0].mimetype;

    // Uploads the profilepicture to S3
    profileImageToUpload = uploadToS3(fileName, stream, fileType)
      .then((profileImagePath) => {
        // Isolate aboutpagepicture elements
        const aboutfileName = req.files.aboutpagepicture[0].originalname;
        const aboutfileType = req.files.aboutpagepicture[0].mimetype;
        const aboutstream = fs.createReadStream(req.files.aboutpagepicture[0].path); // Create "stream" of the file

        // Uploads the aboutpagepicture to S3
        uploadToS3(aboutfileName, aboutstream, aboutfileType)
          .then((pageImagePath) => {
            // Use Sequelize to push to DB
            models.AboutMe.findOne({ where: { id: 1 } })
              .then((id) => {
                id.update({
                  bio: req.body.AboutMe,
                  caption: req.body.AboutMeCaption,
                  image: profileImagePath,
                  aboutpagetext: req.body.AboutPage,
                  aboutpagecaption: req.body.AboutPageCaption,
                  aboutpageimage: pageImagePath,
                  updatedAt: currentDate,
                }).then(() => {
                  res.redirect('../adminaboutme');
                });
              });
          });
      });
    // If only profilepicture has been updated
  } else if (req.files.profilepicture) {
    // Isolate profilepicture elements
    const fileName = req.files.profilepicture[0].originalname;
    const stream = fs.createReadStream(req.files.profilepicture[0].path); // Create "stream" of the file
    const fileType = req.files.profilepicture[0].mimetype;

    // Uploads the profilepicture to S3
    profileImageToUpload = uploadToS3(fileName, stream, fileType)
      .then((profileImagePath) => {
        // Use Sequelize to push to DB
        models.AboutMe.findOne({ where: { id: 1 } })
          .then((id) => {
            id.update({
              bio: req.body.AboutMe,
              caption: req.body.AboutMeCaption,
              image: profileImagePath,
              aboutpagetext: req.body.AboutPage,
              aboutpagecaption: req.body.AboutPageCaption,
              updatedAt: currentDate,
            }).then(() => {
              res.redirect('../adminaboutme');
            });
          });
      });
  } else if (req.files.aboutpagepicture) {
    // Isolate aboutpagepicture elements
    const aboutfileName = req.files.aboutpagepicture[0].originalname;
    const aboutfileType = req.files.aboutpagepicture[0].mimetype;
    const aboutstream = fs.createReadStream(req.files.aboutpagepicture[0].path);

    // Uploads the aboutpagepicture to S3
    uploadToS3(aboutfileName, aboutstream, aboutfileType)
      .then((pageImagePath) => {
        // Use Sequelize to push to DB
        models.AboutMe.findOne({ where: { id: 1 } })
          .then((id) => {
            id.update({
              bio: req.body.AboutMe,
              caption: req.body.AboutMeCaption,
              aboutpagetext: req.body.AboutPage,
              aboutpagecaption: req.body.AboutPageCaption,
              aboutpageimage: pageImagePath,
              updatedAt: currentDate,
            }).then(() => {
              res.redirect('../adminaboutme');
            });
          });
      });
    // If no images uploaded simply update the text
  } else {
    // Use Sequelize to push to DB
    models.AboutMe.findOne({ where: { id: 1 } })
      .then((id) => {
        // Update the data
        id.update({
          bio: req.body.AboutMe,
          caption: req.body.AboutMeCaption,
          image: profileImageToUpload,
          aboutpagetext: req.body.AboutPage,
          aboutpagecaption: req.body.AboutPageCaption,
          updatedAt: currentDate,
        }).then(() => {
          res.redirect('../adminaboutme');
        });
      });
  }
});

router.post('/contact/message', (req, res) => {
  const currentDate = new Date();

  // Use Sequelize to push to DB
  models.Messages.create({
    name: req.body.fname,
    email: req.body.email,
    message: req.body.message,
    createdAt: currentDate,
    updatedAt: currentDate,
  }).then(() => {
    // Send email to alert the admin that a message was recieved
    const mailOptions = {
      from: 'contact@tomcariello.com', // sender address
      to: 'tomcariello@gmail.com', // list of receivers
      subject: 'Someone left you a message', // Subject line
      text: `Name: ${req.body.fname} \n Message: ${req.body.message}`,
    };

    sendAutomaticEmail(mailOptions);
    req.session.messageSent = true;

    res.redirect('../contact');
  });
});

router.isLoggedIn = isLoggedIn;
router.checkAdminStatus = checkAdminStatus;
router.uploadToS3 = uploadToS3;

module.exports = router
