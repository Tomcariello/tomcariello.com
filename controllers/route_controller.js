// const bcrypt = require('bcrypt');
// const bodyParser = require('body-parser');
// const connection = require('../config/connection.js');
// const nodemailer = require('nodemailer');
// const Twitter = require('twitter');

const express = require('express');
const passport = require('passport');
const multer = require('multer');
const fs = require('fs');
const aws = require('aws-sdk');
const path = require('path');
const models = require('../models');
const transporter = require('../config/transporter.js');

const router = express.Router();
// const sequelizeConnection = models.sequelize;
const upload = multer({ dest: path.join(__dirname, '/public/images/') });

// amazon S3 configuration
const S3_BUCKET = process.env.S3_BUCKET;
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
    payload.dynamicData.administrator = true;
  }
  return payload;
}

// Function to upload an image to Amazon S3
const uploadToS3 = (fileName, stream, fileType) => {
  // Create a Promise to control the Async of the file upload
  return new Promise((resolve, reject) => {
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
  });
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
      const payload = { dynamicData: data };

      // Check if user is logged in
      checkAdminStatus(req, payload);

      res.render('index', { dynamicData: payload.dynamicData, layout: 'main-social' });
    });
});

router.get('/portfolio', (req, res) => {
  // get data from projects table & sort it newest first
  models.Project.findAll({ order: [['id', 'DESC']] })
    .then((data) => {
      const payload = { dynamicData: data };
      checkAdminStatus(req, payload);
      res.render('portfolio', { dynamicData: payload.dynamicData });
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

// Load the frontend main blog page
router.get('/blog', (req, res) => {
  models.Blogs.findAll({ order: [['createdAt', 'DESC']] })
    .then((data) => {
      const payload = { dynamicData: data };
      checkAdminStatus(req, payload);
      res.render('blog', { dynamicData: payload.dynamicData, layout: 'main-social' });
    });
});

// Load Specific Blog Pages
router.get('/blogpost', (req, res) => {
  // If no ID provided, redirect back to main blog page
  if (req.query.id == null) {
    res.redirect('blog');
  } else {
    // Query database for specific blog
    models.Blogs.findOne({
      where: { id: req.query.id },
    })
      .then((blogData) => {
        // If no matching entry, redirect back to the main blog page
        if (blogData == null) {
          res.redirect('blog');
        } else { // blog found
          const payload = { dynamicData: blogData };
          checkAdminStatus(req, payload);

          // Check for comments for this blog
          models.Blogcomments.findAll({
            where: { blogid: req.query.id },
          })
            .then((blogComments) => {
              payload.dynamicData["Comments"] = blogComments;

              res.render('blogpost', { dynamicData: payload.dynamicData, layout: 'main-social' });
            }).catch(() => {
              // If there are no comments
              res.render('blogpost', { dynamicData: payload.dynamicData, layout: 'main-social' });
            });
        }
      });
  }
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

router.get('/viewmessages', isLoggedIn, (req, res) => {
  // Pull message data from database
  models.Messages.findAll({})
    .then((data) => {
      const payload = { dynamicData: data };
      checkAdminStatus(req, payload);
      res.render('viewmessages', { dynamicData: payload.dynamicData });
    });
});

// List all blog entries for management
router.get('/blogmanagement', isLoggedIn, (req, res) => {
  // Pull blog data from database
  models.Blogs.findAll({ order: [['createdAt', 'DESC']] })
    .then((data) => {
      const payload = { dynamicData: data };
      checkAdminStatus(req, payload);
      res.render('blogmanagement', { dynamicData: payload.dynamicData });
    });
});

router.get('/createblog', isLoggedIn, (req, res) => {
  // Add administrator credential to the created object
  const payload = { dynamicData: "administrator" };
  checkAdminStatus(req, payload);
  res.render('createblog', { dynamicData: payload.dynamicData });
});

router.get('/editblog', isLoggedIn, (req, res) => {
  if (req.query.id == null) {
    res.redirect('blogmanagement');
  } else {
    // Pull Blog data from database
    models.Blogs.findOne({
      where: { id: req.query.id },
    })
      .then((blog) => {
        const payload = { dynamicData: blog };
        checkAdminStatus(req, payload);
        res.render('editblog', { dynamicData: payload.dynamicData });
      });
  }
});

// Route to access the comments page per blog
router.get('/blogcomments', isLoggedIn, (req, res) => {
  if (req.query.id == null) {
    res.redirect('blogmanagement');
  } else {
    // Pull Blog Comment data from database
    models.Blogcomments.findAll({
      where: { blogid: req.query.id },
    })
      .then((data) => {
        const payload = { dynamicData: data };
        checkAdminStatus(req, payload);

        // Look up the main blog associated with these comments
        models.Blogs.findOne({
          where: { id: req.query.id },
        })
          .then((blogdata) => {
            // Add the title of the blog to the object
            payload.dynamicData.blogTitle = decodeURIComponent(blogdata.headline);
            // Render the page
            res.render('blogcomments', { dynamicData: payload.dynamicData });
          });
      });
  }
});

router.get('/adminaboutme', isLoggedIn, (req, res) => {
  // Pull about me data from database
  models.AboutMe.findOne({
    where: { id: 1 },
  })
    .then((data) => {
      const payload = { dynamicData: data };
      checkAdminStatus(req, payload);
      res.render('adminaboutme', { dynamicData: payload.dynamicData });
    });
});

router.get('/adminportfolio', isLoggedIn, (req, res) => {
  // pull portfolio/project data from database
  models.Project.findAll({})
    .then((projects) => {
      const payload = { dynamicData: projects };
      checkAdminStatus(req, payload);
      res.render('adminportfolio', { dynamicData: payload.dynamicData });
    });
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

// Delete Message
router.get('/deletecomment/:commentId', isLoggedIn, (req, res) => {
  if (req.query.blogid == null) {
    res.redirect('../blogmanagement');
  } else {
    // Use Sequelize to find the relevant DB object
    models.Blogcomments.findOne({ where: { id: req.params.commentId } })
      .then((id) => {
        // Delete the object
        id.destroy();
      }).then(() => {
        res.redirect(`../blogcomments?id= ${req.query.blogid}`);
      });
  }
});

// Delete Blog
router.get('/deleteblog/:blogId', isLoggedIn, (req, res) => {
  // Use Sequelize to find the relevant DB object
  models.Blogs.findOne({ where: { id: req.params.blogId } })
    .then((blogId) => {
      // Delete the object
      blogId.destroy();
    }).then(() => {
      res.redirect('../blogmanagement');
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

// Process New Blog Comments
router.post('/postblogcomment/:blogid', (req, res) => {
  const currentDate = new Date();

  // Use Sequelize to push to DB
  models.Blogcomments.create({
    blogid: req.params.blogid,
    commentheadline: req.body.BlogCommentHeadline,
    commenttext: req.body.BlogCommentText,
    commentauthor: req.body.BlogCommentName,
    createdAt: currentDate,
    updatedAt: currentDate,
  }).then(() => {
    res.redirect(`../blogpost?id= ${req.params.blogid}`);
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

// *************************************
// *************Blog Routes*************
// *************************************

// Process new Blog requests
// Note: Image upload is not in place yet. These are just placeholders
router.post('/newblog', upload.single('blogpicture'), isLoggedIn, (req, res) => {
  // var blogImageToUpload;
  const currentDate = new Date();

  // Check if any image(s) were uploaded
  if (typeof req.file !== 'undefined') {
    // Process file being uploaded
    const fileName = req.file.originalname;
    const fileType = req.file.mimetype;
    const stream = fs.createReadStream(req.file.path); // Create "stream" of the file

    uploadToS3(fileName, stream, fileType)
      .then((blogImagePath) => {
        // Use Sequelize to push to DB
        models.Blogs.create({
          headline: req.body.NewBlogHeadline,
          blogtext: req.body.NewBlogtext,
          blogimage: blogImagePath,
          imagecaption: req.body.NewImageCaption,
          author: req.body.NewBlogAuthor,
          createdAt: currentDate,
          updatedAt: currentDate,
        }).then(() => {
          res.redirect('../blogmanagement');
        })
          .catch((err) => {
            // print the error details
            console.log(err);
          });
      });
  } else { // no image to upload
    models.Blogs.create({
      headline: req.body.NewBlogHeadline,
      blogtext: req.body.NewBlogtext,
      imagecaption: req.body.NewImageCaption,
      author: req.body.NewBlogAuthor,
      createdAt: currentDate,
      updatedAt: currentDate,
    }).then(() => {
      res.redirect('../blogmanagement');
    })
      .catch((err) => {
        // print the error details
        console.log(err);
      });
  }
});

// Process Blog update requests
router.post('/updateblog/:blogId', upload.single('blogpicture'), isLoggedIn, (req, res) => {
  // var blogImageToUpload;
  const currentDate = new Date();

  // Check if any image(s) were uploaded
  if (typeof req.file !== 'undefined') {
    // Process file being uploaded
    const fileName = req.file.originalname;
    const fileType = req.file.mimetype;
    const stream = fs.createReadStream(req.file.path); // Create "stream" of the file

    uploadToS3(fileName, stream, fileType)
      .then((blogImagePath) => {
        models.Blogs.findOne({ where: { id: req.params.blogId } })
          .then((id) => {
            id.update({
              headline: req.body.BlogHeadline,
              blogtext: req.body.Blogtext,
              blogimage: blogImagePath,
              imagecaption: req.body.ImageCaption,
              author: req.body.BlogAuthor,
              updatedAt: currentDate,
            }).then(() => {
              res.redirect(`../editblog?id= ${req.params.blogId}`);
            })
              .catch((err) => {
                // print the error details
                console.log(err);
              });
          });
      });
  } else { // no image to upload
    models.Blogs.findOne({ where: { id: req.params.blogId } })
      .then((blog) => {
        // Update the data
        blog.update({
          headline: req.body.BlogHeadline,
          blogtext: req.body.Blogtext,
          imagecaption: req.body.ImageCaption,
          author: req.body.BlogAuthor,
          updatedAt: currentDate,
        }).then(() => {
          res.redirect(`../editblog?id= ${req.params.blogId}`);
        })
          .catch((err) => {
            // print the error details
            console.log(err);
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
module.exports = router;
