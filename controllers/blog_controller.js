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

router.get('/blog', async (req, res) => {
  try {
    const blogs = await models.Blogs.findAll({ 
      order: [['createdAt', 'DESC']] 
    });

    const plainBlogs = blogs.map(blog => blog.get({ plain: true }));

    const payload = { dynamicData: plainBlogs };
    checkAdminStatus(req, payload);

    res.render('blog', { 
      dynamicData: payload.dynamicData, 
      // layout: 'main-social' 
      layout: 'main' 
    });

  } catch (error) {
    console.error("Blog fetch error:", error);
    res.status(500).send("Error loading blog posts");
  }
});

router.get('/blogpost', (req, res) => {
  if (req.query.id == null) {
    res.redirect('blog');
  } else {
    models.Blogs.findOne({
      where: { id: req.query.id },
    })
      .then((blogData) => {
        blogData = JSON.stringify(blogData);
        blogData = JSON.parse(blogData);
  
        if (blogData == null) {
          res.redirect('blog');
        } else {
          const payload = { dynamicData: blogData };
          checkAdminStatus(req, payload);

          models.Blogcomments.findAll({
            where: { blogid: req.query.id },
          })
            .then((blogComments) => {
              blogComments = JSON.stringify(blogComments);
              blogComments = JSON.parse(blogComments);
              payload.dynamicData.Comments = blogComments;

              res.render('blogpost', { dynamicData: payload.dynamicData, layout: 'main' });
            }).catch(() => {
              res.render('blogpost', { dynamicData: payload.dynamicData, layout: 'main' });
            });
        }
      });
  }
});

// ============================================
// =====GET PROTECTED routes to load pages=====
// ============================================
router.get('/blogmanagement', isLoggedIn, async (req, res) => {
  try {
    const blogs = await models.Blogs.findAll({ 
      order: [['createdAt', 'DESC']] 
    });

    const cleanBlogs = blogs.map(blog => blog.get({ plain: true }));

    const payload = { dynamicData: cleanBlogs };
    checkAdminStatus(req, payload);

    res.render('blogmanagement', { dynamicData: payload.dynamicData });

  } catch (err) {
    console.error("Error loading blog management:", err);
    res.status(500).render('error', { 
      message: "Failed to load blog management list.", 
      error: err 
    });
  }
});

router.get('/createblog', isLoggedIn, (req, res) => {
  // Add administrator credential to the created object
  const payload = { dynamicData: 'administrator' };
  checkAdminStatus(req, payload);
  res.render('createblog', { dynamicData: payload.dynamicData });
});

router.get('/editblog', isLoggedIn, async (req, res) => {
  try {
    if (!req.query.id) {
      return res.redirect('blogmanagement');
    }

    const blog = await models.Blogs.findOne({
      where: { id: req.query.id },
    });

    if (!blog) {
      return res.redirect('blogmanagement');
    }

    const cleanBlog = blog.get({ plain: true });

    const payload = { dynamicData: cleanBlog };
    checkAdminStatus(req, payload);

    res.render('editblog', { dynamicData: payload.dynamicData });

  } catch (err) {
    console.error("Error loading edit blog page:", err);
    res.status(500).render('error', { 
      message: "An error occurred while trying to load the blog post for editing.", 
      error: err 
    });
  }
});

// Route to access the comments page per blog
router.get('/blogcomments', isLoggedIn, async (req, res) => {
  try {
    if (!req.query.id) {
      return res.redirect('blogmanagement');
    }

    const [comments, parentBlog] = await Promise.all([
      models.Blogcomments.findAll({ where: { blogid: req.query.id } }),
      models.Blogs.findOne({ where: { id: req.query.id } })
    ]);

    const cleanComments = comments.map(comment => comment.get({ plain: true }));

    let blogTitle = "Unknown Blog";
    if (parentBlog) {
      blogTitle = decodeURIComponent(parentBlog.headline);
    }

    const payload = { 
      comments: cleanComments, 
      blogTitle: blogTitle,
      blogId: req.query.id 
    };

    checkAdminStatus(req, payload);

    res.render('blogcomments', { dynamicData: payload });

  } catch (err) {
    console.error("Error loading blog comments:", err);
    res.status(500).render('error', { 
      message: "Failed to retrieve comments.", 
      error: err 
    });
  }
});

// Delete Blog
router.get('/deleteblog/:blogId', isLoggedIn, async (req, res) => {
  try {
    const blogEntry = await models.Blogs.findOne({ 
      where: { id: req.params.blogId } 
    });

    if (blogEntry) {
      await blogEntry.destroy();
      console.log(`Blog ${req.params.blogId} deleted successfully.`);
    } else {
      console.log(`Blog ${req.params.blogId} not found.`);
    }

    res.redirect('../blogmanagement');

  } catch (err) {
    console.error("Error during blog deletion:", err);
    res.status(500).render('error', { 
      message: "Could not delete the blog post.", 
      error: err 
    });
  }
});

// ===============================================
// =====POST routes to record to the database=====
// ===============================================

// Process New Blog Comments
// Disabled since bots found the link & I don't want to setup actual 'Users'
// router.post('/postblogcomment/:blogid', (req, res) => {
//   const currentDate = new Date();

//   // Use Sequelize to push to DB
//   models.Blogcomments.create({
//     blogid: req.params.blogid,
//     commentheadline: req.body.BlogCommentHeadline,
//     commenttext: req.body.BlogCommentText,
//     commentauthor: req.body.BlogCommentName,
//     createdAt: currentDate,
//     updatedAt: currentDate,
//   }).then(() => {
//     res.redirect(`../blogpost?id= ${req.params.blogid}`);
//   });
// });

// Delete Message
router.get('/deletecomment/:commentId', isLoggedIn, async (req, res) => {
  try {
    if (!req.query.blogid) {
      return res.redirect('../blogmanagement');
    }

    const comment = await models.Blogcomments.findOne({ 
      where: { id: req.params.commentId } 
    });

    if (comment) {
      await comment.destroy();
    }

    res.redirect(`../blogcomments?id=${req.query.blogid}`);

  } catch (err) {
    console.error("Error deleting comment:", err);
    res.status(500).send("An error occurred while deleting the comment.");
  }
});

// *************************************
// *************Blog Routes*************
// *************************************

// Process new Blog requests
router.post('/newblog', isLoggedIn, multerUpload.single('blogpicture'), async (req, res) => {
  try {
    const currentDate = new Date();
    let blogImagePath = null;

    if (req.file) {
      blogImagePath = await uploadToS3(
        req.file.originalname, 
        req.file.path, 
        req.file.mimetype
      );
    }

    await models.Blogs.create({
      headline: req.body.NewBlogHeadline,
      blogtext: req.body.NewBlogtext,
      blogimage: blogImagePath,
      imagecaption: req.body.NewImageCaption,
      author: req.body.NewBlogAuthor,
      createdAt: currentDate,
      updatedAt: currentDate,
    });

    res.redirect('../blogmanagement');

  } catch (err) {
    console.error("Error in /newblog route:", err);
    res.status(500).send("Something went wrong with the blog upload.");
  }
});

// Process Blog update requests
router.post('/updateblog/:blogId', isLoggedIn, multerUpload.single('blogpicture'), async (req, res) => {
  try {
    const { blogId } = req.params;
    const currentDate = new Date();

    // Default to the existing image sent in the body (if no new file is uploaded)
    let blogImagePath = req.body.existingBlogImage; 

    if (req.file) {
      blogImagePath = await uploadToS3(
        req.file.originalname,
        req.file.path,
        req.file.mimetype
      );
    }

    const blog = await models.Blogs.findOne({ where: { id: blogId } });

    if (!blog) {
      return res.status(404).send("Blog post not found.");
    }

    await blog.update({
      headline: req.body.BlogHeadline,
      blogtext: req.body.Blogtext,
      blogimage: blogImagePath,
      imagecaption: req.body.ImageCaption,
      author: req.body.BlogAuthor,
      updatedAt: currentDate,
    });

    res.redirect(`../editblog?id=${blogId}`);
  } catch (err) {
    console.error("Error in /updateblog route:", err);
    res.status(500).send("Update failed.");
  }
});

module.exports = router;
