var express = require('express');
var bcrypt = require('bcrypt');
var router = express.Router();
var models = require('../models');
var bodyParser = require('body-parser');
var connection = require('../config/connection.js');
var passport = require('passport');
var nodemailer = require('nodemailer');
var transporter = require('../config/transporter.js');
var sequelizeConnection = models.sequelize;
var multer  = require('multer');
var upload = multer({dest: __dirname + '/public/images/'});
var fs = require('fs');
var aws = require('aws-sdk');
var Twitter = require('twitter');

//amazon S3 configuration
var S3_BUCKET = process.env.S3_BUCKET;
var S3_accessKeyId = process.env.AWS_ACCESS_KEY_ID
var S3_secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

//Twitter configuration
var twitterClient = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});


//==================================
//=====GET routes to load pages=====
//==================================
router.get('/', function(req, res) {
  res.redirect('/index');
});

router.get('/index', function(req, res) {
  var tweetResponse;

  //Get my tweets
  twitterClient.get('statuses/user_timeline', function(error, tweets, response) {
    if(error) throw error;

    tweetResponse = tweets;

    for (var i=0; i < tweets.length; i++) {
      var tweetArray = tweets[i].created_at.split(" ");
      // console.log(tweetArray[1] + " " + tweetArray[2] + " " + tweetArray[5] + ": " + tweets[i].text);
    }
  });

  //Query database for page information
  models.AboutMe.findOne({
    where: {id: 1}
  })
  .then(function(data) {
    var payload = {dynamicData: data};

    //Check if user is logged in
    checkAdminStatus(req, payload);

    res.render('index', {dynamicData: payload.dynamicData});
  })
});

router.get('/portfolio', function (req, res) {
  //get data from projects table & sort it newest first
  models.Project.findAll({order: 'id  DESC'})
  .then(function(data) {
    var payload = {dynamicData: data}

    checkAdminStatus(req, payload);

    res.render('portfolio', {dynamicData: payload.dynamicData});
  })
});

router.get('/contact', function(req, res) {
  var payload = {
    dynamicData: {
      messageSent: false
    }
  }
  
  checkAdminStatus(req, payload);

  //Add messageSent credential to the created object
  if (req.session.messageSent) {
    payload.dynamicData.messageSent = true;
    req.session.messageSent = false;
  }
  
  res.render('contact', {dynamicData: payload.dynamicData});
});

//Load the frontend main blog page
router.get('/blog', function(req, res) {
  models.Blogs.findAll({order: 'createdAt DESC'})
  .then(function(data) {
    var payload = {dynamicData: data}

    checkAdminStatus(req, payload);

    res.render('blog', {dynamicData: payload.dynamicData});
  })
});

//Load Specific Blog Pages
router.get('/blogpost', function(req, res) {

  //If no ID provided, redirect back to main blog page
  if (req.query.id == null) {
    res.redirect('blog');
  } else { 
    //Query database for specific blog
    models.Blogs.findOne({
      where: {id: req.query.id}
    })
    .then(function(data) {
      //If no matching entry, redirect back to the main blog page
      if (data == null) {
        res.redirect('blog');
      } else { //blog found

        var payload = {dynamicData: data}

        checkAdminStatus(req, payload);

        //Check for comments for this blog
        models.Blogcomments.findAll({
          where: {blogid: req.query.id}
        })
          .then(function(data) {
            payload.dynamicData["Comments"] = data;

            res.render('blogpost', {dynamicData: payload.dynamicData});
        }).catch(function(err) {
          // If there are no comments
          res.render('blogpost', {dynamicData: payload.dynamicData});
        });
      }
    })
  }
});

//Registration page. Disabled since no more registrations are required
router.get('/register', function(req, res) {
  // res.render('register');
  res.redirect('/index');
});

router.get('/login', function(req, res) {
  res.render('login');
});

//============================================
//=====GET PROTECTED routes to load pages=====
//============================================
router.get('/adminportal', isLoggedIn, function(req, res) {
  res.render('adminportal');
});

router.get('/viewmessages', isLoggedIn, function(req, res) {

  //Pull message data from database
  models.Messages.findAll({})
  .then(function(data) {
    var payload = {dynamicData: data}

    checkAdminStatus(req, payload);

    res.render('viewmessages', {dynamicData: payload.dynamicData});
  })
});

//List all blog entries for management
router.get('/blogmanagement', isLoggedIn, function(req, res) {
  //Pull blog data from database
  models.Blogs.findAll({order: 'createdAt DESC'})
  .then(function(data) {
    var payload = {dynamicData: data}

    checkAdminStatus(req, payload);

    res.render('blogmanagement', {dynamicData: payload.dynamicData});
  })
});

router.get('/createblog', isLoggedIn, function(req, res) {
  //Add administrator credential to the created object
  var payload = {dynamicData: "administrator"}
  
  checkAdminStatus(req, payload);

  res.render('createblog', {dynamicData: payload.dynamicData});
});

router.get('/editblog', isLoggedIn, function(req, res) {
  if (req.query.id == null) {
    res.redirect('blogmanagement');
  } else { 
    //Pull Blog data from database
    models.Blogs.findOne({
      where: {id: req.query.id}
    })
    .then(function(data) {
      var payload = {dynamicData: data}
      checkAdminStatus(req, payload);

      res.render('editblog', {dynamicData: payload.dynamicData});
    })
  }
});

router.get('/blogcomments', isLoggedIn, function(req, res) {
  if (req.query.id == null) {
    res.redirect('blogmanagement');
  } else { 
    //Pull Blog data from database
    models.Blogcomments.findAll({
      where: {blogid: req.query.id}
    })
    .then(function(data) {
      var payload = {dynamicData: data}
      checkAdminStatus(req, payload);

      res.render('blogcomments', {dynamicData: payload.dynamicData});
    })
  }
});

router.get('/adminaboutme', isLoggedIn, function(req, res) {
  //Pull about me data from database
  models.AboutMe.findOne({
    where: {id: 1}
  })
  .then(function(data) {
    var payload = {dynamicData: data}

    checkAdminStatus(req, payload);

    res.render('adminaboutme', {dynamicData: payload.dynamicData});
  })
});

router.get('/adminportfolio', isLoggedIn, function(req, res) {
  //pull portfolio/project data from database
  models.Project.findAll({})
  .then(function(data) {
    var payload = {dynamicData: data}
    
    checkAdminStatus(req, payload);

    res.render('adminportfolio', {dynamicData: payload.dynamicData});
  })
});

//Delete Portfolio Project
router.get('/deleteportfolioproject/:projectid', isLoggedIn, function(req, res) {

  //Use Sequelize to find the relevant DB object
  models.Project.findOne({ where: {id: req.params.projectid} })
  .then(function(id) {
    //Delete the object
    id.destroy();
  }).then(function(){
    res.redirect('../adminportfolio');
  })
})

//Delete Message
router.get('/deletemessage/:messageId', isLoggedIn, function(req, res) {
  
  //Use Sequelize to find the relevant DB object
  models.Messages.findOne({ where: {id: req.params.messageId} })
  .then(function(id) {
    //Delete the object
    id.destroy();
  }).then(function(){
    res.redirect('../viewmessages');
  })
})

//Delete Message
router.get('/deletecomment/:commentId', isLoggedIn, function(req, res) {

  console.log(req.params.commentId);

  if (req.query.blogid == null) {
    res.redirect('../blogmanagement');
  } else { 

    //Use Sequelize to find the relevant DB object
    models.Blogcomments.findOne({ where: {id: req.params.commentId} })
    .then(function(id) {
      //Delete the object
      id.destroy();
    }).then(function(){
      res.redirect('../blogcomments?id=' + req.query.blogid);
    })
  }
})

//Delete Blog
router.get('/deleteblog/:blogId', isLoggedIn, function(req, res) {
  
  //Use Sequelize to find the relevant DB object
  models.Blogs.findOne({ where: {id: req.params.blogId} })
  .then(function(id) {
    //Delete the object
    id.destroy();
  }).then(function(){
    res.redirect('../blogmanagement');
  })
})
//===============================================
//=====POST routes to record to the database=====
//===============================================

//Process registration requests using Passport
router.post('/register', passport.authenticate('local-signup', {
  successRedirect: ('../adminportal'), //if authenticated, proceed to adminportal page
  failureRedirect: ('login') //if failed, redirect to login page (consider options here!!)
}));

//Process login requests with Passport
router.post('/login', passport.authenticate('local-login', {
  successRedirect: ('../adminportal'), //if login successful, proceed to adminportal page
  failureRedirect: ('login') //if failed, redirect to login page (consider options here!!)
}));

//Process new portfolio object requests
router.post('/newportfolio', isLoggedIn, function(req, res) {
  var currentDate = new Date();

  //Use Sequelize to push to DB
  models.Project.create({
    ProjectName: req.body.NewProjectName,
    ProjectBlurb: req.body.NewProjectBlurb,
    ProjectURL: req.body.NewProjectURL,
    GithubURL: req.body.NewGithubURL,
    ProjectIMG: req.body.NewProjectIMG,
    createdAt: currentDate,
    updatedAt: currentDate
  }).then(function(){
    res.redirect('../adminportfolio');
  })
  .catch(function(err) {
    // print the error details
    console.log(err);
  });
});

router.post('/contact/message', function(req, res) {
  var currentDate = new Date();
  
  //Use Sequelize to push to DB
  models.Messages.create({
      name: req.body.fname,
      email: req.body.email,
      message: req.body.message,
      createdAt: currentDate,
      updatedAt: currentDate
  }).then(function(){

    //Send email to alert the admin that a message was recieved
    var mailOptions = {
        from: 'contact@tomcariello.com', // sender address
        to: 'tomcariello@gmail.com', // list of receivers
        subject: 'Someone left you a message', // Subject line
        text: 'Name: ' + req.body.fname + '\n Message: ' + req.body.message
    };

    sendAutomaticEmail(mailOptions);
    req.session.messageSent = true;

    res.redirect('../contact');
  });
});

//Process New Blog Comments
router.post('/postblogcomment/:blogid', function(req, res) {
  var currentDate = new Date();
  
  //Use Sequelize to push to DB
  models.Blogcomments.create({
      blogid: req.params.blogid,
      commentheadline: req.body.BlogCommentHeadline,
      commenttext: req.body.BlogCommentText,
      commentauthor: req.body.BlogCommentName,
      createdAt: currentDate,
      updatedAt: currentDate
  }).then(function(){

    res.redirect('../blogpost?id=' + req.params.blogid);
  });
});

//Process portfolio update requests
router.post('/updateportfolio/:portfolioId', isLoggedIn, upload.single('portfoliopicture'), function(req, res) {
  var currentDate = new Date();

  //Retain previous image location
  var portfolioImageToUpload = req.body['ProjectIMG' + req.params.portfolioId];

  //Check if any image(s) were uploaded
  if (typeof req.file !== "undefined") {
    console.log("****************");
    console.log(S3_BUCKET);
    console.log("****************");




    //Process file being uploaded
    var fileName = req.file.originalname;
    var fileType = req.file.mimetype;
    var stream = fs.createReadStream(req.file.path) //Create "stream" of the file

    //Create Amazon S3 specific object
    var s3 = new aws.S3();

    var params = {
      Bucket: S3_BUCKET,
      Key: fileName, //This is what S3 will use to store the data uploaded.
      Body: stream, //the actual *file* being uploaded
      ContentType: fileType, //type of file being uploaded
      ACL: 'public-read', //Set permissions so everyone can see the image
      processData: false,
      accessKeyId: S3_accessKeyId,
      secretAccessKey: S3_secretAccessKey
    }

    s3.upload( params, function(err, data) {
      if (err) {
        console.log("err is " + err);
      }

      //Get S3 filepath & set it to portfolioImageToUpload
      portfolioImageToUpload = data.Location

      var currentDate = new Date();

      //Use Sequelize to find the relevant DB object
      models.Project.findOne({ where: {id: req.params.portfolioId} })
      
      .then(function(id) {
        //Update the data
        id.updateAttributes({
          ProjectName: req.body.ProjectName,
          ProjectBlurb: req.body['ProjectBlurb' +req.params.portfolioId],
          ProjectURL: req.body.ProjectURL,
          GithubURL: req.body.GithubURL,
          ProjectIMG: portfolioImageToUpload,
          updatedAt: currentDate
        }).then(function(){
          res.redirect('../adminportfolio');
        })
      })
    });
  } else { //No image to upload, just update the text

    //Use Sequelize to find the relevant DB object
    models.Project.findOne({ where: {id: req.params.portfolioId} })
    
    .then(function(id) {
      //Update the data
      id.updateAttributes({
        ProjectName: req.body.ProjectName,
        ProjectBlurb: req.body['ProjectBlurb' + req.params.portfolioId],
        ProjectURL: req.body.ProjectURL,
        GithubURL: req.body.GithubURL,
        ProjectIMG: portfolioImageToUpload,
        updatedAt: currentDate
      }).then(function(){
        res.redirect('../adminportfolio');
      })
    })
  }
});

//Process portfolio update requests
router.post('/updateAboutMe', isLoggedIn, upload.single('profilepicture'), function(req, res) {
  var profileImageToUpload;
  var currentDate = new Date();

  //Process image on submit; temporary
  if (typeof req.file !== "undefined") {
    //Process file being uploaded
    var fileName = req.file.originalname;
    var fileType = req.file.mimetype;
    var stream = fs.createReadStream(req.file.path) //Create "stream" of the file

    //Create Amazon S3 specific object
    var s3 = new aws.S3();

    var params = {
      Bucket: S3_BUCKET,
      Key: fileName, //This is what S3 will use to store the data uploaded.
      Body: stream, //the actual *file* being uploaded
      ContentType: fileType, //type of file being uploaded
      ACL: 'public-read', //Set permissions so everyone can see the image
      processData: false,
      accessKeyId: S3_accessKeyId,
      secretAccessKey: S3_secretAccessKey
      }

    s3.upload( params, function(err, data) {
      if (err) {
        console.log("err is " + err);
      }

      //Get S3 filepath & set it to publicationImageToUpload
      profileImageToUpload = data.Location

      //Use Sequelize to push to DB
      models.AboutMe.findOne({ where: {id: 1} })

      .then(function(id) {
        //Update the data
        id.updateAttributes({
          bio: req.body.AboutMe,
          caption: req.body.AboutMeCaption,
          image: profileImageToUpload,
          updatedAt: currentDate
        }).then(function(){
          res.redirect('../adminaboutme');
        })
      })            
    });
  } else {
    //Use Sequelize to push to DB
    models.AboutMe.findOne({ where: {id: 1} })
    
    .then(function(id) {
      //Update the data
      id.updateAttributes({
        bio: req.body.AboutMe,
        caption: req.body.AboutMeCaption,
        image: profileImageToUpload,
        updatedAt: currentDate
      }).then(function(){
        res.redirect('../adminaboutme');
      })
    })
  }
});

// *************************************
// *************Blog Routes*************
// *************************************

//Process new Blog requests
// Note: Image upload is not in place yet. These are just placeholders
router.post('/newblog', upload.single('blogpicture'), isLoggedIn, function(req, res) {
  var blogImageToUpload;
  var currentDate = new Date();

  //Check if any image(s) were uploaded
  if (typeof req.file !== "undefined") {
    //Process file being uploaded
    var fileName = req.file.originalname;
    var fileType = req.file.mimetype;
    var stream = fs.createReadStream(req.file.path) //Create "stream" of the file

    //Create Amazon S3 specific object
    var s3 = new aws.S3();

    var params = {
      Bucket: S3_BUCKET,
      Key: fileName, //This is what S3 will use to store the data uploaded.
      Body: stream, //the actual *file* being uploaded
      ContentType: fileType, //type of file being uploaded
      ACL: 'public-read', //Set permissions so everyone can see the image
      processData: false,
      accessKeyId: S3_accessKeyId,
      secretAccessKey: S3_secretAccessKey
    }
    s3.upload( params, function(err, data) {
      if (err) {
        console.log("err is " + err);
      }
      
      //Get S3 filepath & set it to blogImageToUpload
      blogImageToUpload = data.Location

      //Use Sequelize to push to DB
      models.Blogs.create({
        headline: req.body.NewBlogHeadline,
        blogtext: req.body.NewBlogtext,
        blogimage: blogImageToUpload,
        imagecaption: req.body.NewImageCaption,
        author: req.body.NewBlogAuthor,
        createdAt: currentDate,
        updatedAt: currentDate
      }).then(function(){
        res.redirect('../blogmanagement');
      })
      .catch(function(err) {
        // print the error details
        console.log(err);
      });
    });
  } else { //no image to upload
    models.Blogs.create({
      headline: req.body.NewBlogHeadline,
      blogtext: req.body.NewBlogtext,
      imagecaption: req.body.NewImageCaption,
      author: req.body.NewBlogAuthor,
      createdAt: currentDate,
      updatedAt: currentDate
    }).then(function(){
      res.redirect('../blogmanagement');
    })
    .catch(function(err) {
      // print the error details
      console.log(err);
    });
  }
});

//Process Blog update requests
router.post('/updateblog/:blogId', upload.single('blogpicture'), isLoggedIn, function(req, res) {
  var blogImageToUpload;
  var currentDate = new Date();

  //Check if any image(s) were uploaded
  if (typeof req.file !== "undefined") {
    //Process file being uploaded
    var fileName = req.file.originalname;
    var fileType = req.file.mimetype;
    var stream = fs.createReadStream(req.file.path) //Create "stream" of the file

    //Create Amazon S3 specific object
    var s3 = new aws.S3();

    var params = {
      Bucket: S3_BUCKET,
      Key: fileName, //This is what S3 will use to store the data uploaded.
      Body: stream, //the actual *file* being uploaded
      ContentType: fileType, //type of file being uploaded
      ACL: 'public-read', //Set permissions so everyone can see the image
      processData: false,
      accessKeyId: S3_accessKeyId,
      secretAccessKey: S3_secretAccessKey
    }
    s3.upload( params, function(err, data) {
      if (err) {
        console.log("err is " + err);
      }

      //Get S3 filepath & set it to blogImageToUpload
      blogImageToUpload = data.Location

      models.Blogs.findOne({ where: {id: req.params.blogId} })
      .then(function(id) {
        id.updateAttributes({
          headline: req.body.BlogHeadline,
          blogtext: req.body.Blogtext,
          blogimage: blogImageToUpload,
          imagecaption: req.body.ImageCaption,
          author: req.body.BlogAuthor,
          updatedAt: currentDate
        }).then(function(){
          res.redirect('../editblog?id=' + req.params.blogId);
        })
        .catch(function(err) {
          // print the error details
          console.log(err);
        });
      });
    });
  } else { //no image to upload
    models.Blogs.findOne({ where: {id: req.params.blogId} })
    .then(function(id) {

      //Update the data
      id.updateAttributes({
        headline: req.body.BlogHeadline,
        blogtext: req.body.Blogtext,
        imagecaption: req.body.ImageCaption,
        author: req.body.BlogAuthor,
        updatedAt: currentDate
      }).then(function(){
        res.redirect('../editblog?id=' + req.params.blogId);
      })
      .catch(function(err) {
        // print the error details
        console.log(err);
      });
    });
  }
});

router.post('/contact/message', function(req, res) {
  var currentDate = new Date();
  
  //Use Sequelize to push to DB
  models.Messages.create({
      name: req.body.fname,
      email: req.body.email,
      message: req.body.message,
      createdAt: currentDate,
      updatedAt: currentDate
  }).then(function(){

    //Send email to alert the admin that a message was recieved
    var mailOptions = {
        from: 'contact@tomcariello.com', // sender address
        to: 'tomcariello@gmail.com', // list of receivers
        subject: 'Someone left you a message', // Subject line
        text: 'Name: ' + req.body.fname + '\n Message: ' + req.body.message
    };

    sendAutomaticEmail(mailOptions);
    req.session.messageSent = true;

    res.redirect('../contact');
  });
});

// route middleware to make sure user is verified
function isLoggedIn(req, res, next) {
  // if user is authenticated in the session, carry on
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('/');
  }  
}

function sendAutomaticEmail(mailOptions, req, res) {
  transporter.sendMail(mailOptions, function(error, info){
    if(error){
        console.log(error);
    } else {
        console.log('Message sent: ' + info.response);
    };
  });
}

//Check Administrator status and add to object
function checkAdminStatus(req, payload) {
  if (req.user) {
    payload.dynamicData["administrator"] = true;
  }

  return payload;
}

module.exports = router;