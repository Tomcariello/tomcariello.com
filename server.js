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

require('./config/passportConfig.js')(passport);

app.use('/public', express.static(`${__dirname}/public`));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

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
    eq: (a, b) => a === b,
  },
}));
app.set('view engine', 'handlebars');

app.use(session({
  secret: process.env.SESSION_SECRET || 'tomtest',
  resave: false, 
  saveUninitialized: false, 
}));
app.use(passport.initialize());
app.use(passport.session());

const routes = require('./controllers/route_controller.js');
const blogRoutes = require('./controllers/blog_controller.js');
const puzzleRoutes = require('./controllers/puzzle_controller.js');
app.use('/', routes);
app.use('/', blogRoutes);
app.use('/', puzzleRoutes);

const PORT = process.env.PORT || 3000;

db.sequelize.sync({ force: false }).then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server launched on port ${PORT}`);
  });
}).catch((err) => {
  console.error("❌ Database sync failed:", err);
});
