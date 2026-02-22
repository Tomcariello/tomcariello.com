require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const session = require('express-session');
const moment = require('moment');
const exphbs = require('express-handlebars');

const db = require("./models");
const app = express();

// 1. Passport Config - One time is enough!
require('./config/passportConfig.js')(passport);

// 2. Middleware & Static Files
app.use('/public', express.static(`${__dirname}/public`));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); // Added this in case you use AJAX/Fetch for the Puzzles

// 3. Handlebars Setup
app.engine('handlebars', exphbs.engine({
  defaultLayout: 'main',
  helpers: {
    formatdate(datetime) {
      return moment(datetime).format('DD MMMM - YYYY');
    },
    limittext(data) {
      const cleanData = decodeURIComponent(data || '');
      return cleanData.length > 400 ? `${cleanData.substring(0, 400)}...` : cleanData;
    },
    decodeSummernote(data) {
      return decodeURIComponent(data || '');
    },
    json: function (context) {
      return JSON.stringify(context);
    },
  },
}));
app.set('view engine', 'handlebars');

// 4. Session & Passport (The Order Matters)
app.use(session({
  secret: process.env.SESSION_SECRET || 'tomtest', // Best practice: use .env for secrets
  resave: false, // Changed to false: modern express-session recommendation
  saveUninitialized: false, // Prevents "empty" session objects from cluttering DB
}));
app.use(passport.initialize());
app.use(passport.session());

// 5. Routes
const routes = require('./controllers/route_controller.js');
const blogRoutes = require('./controllers/blog_controller.js');
const puzzleRoutes = require('./controllers/puzzle_controller.js');
app.use('/', routes);
app.use('/', blogRoutes);
app.use('/', puzzleRoutes);

// 6. Database Sync & Start
const PORT = process.env.PORT || 3000;

// Syncing models to the database
db.sequelize.sync({ force: false }).then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server launched on port ${PORT}`);
  });
}).catch((err) => {
  console.error("❌ Database sync failed:", err);
});
