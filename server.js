const dotenv = require('dotenv').config();
const db = require("./models");

// Set up the server to use mySQL locally & Jaws once deployed
// const Sequelize = require('sequelize');

// let connection;

// if (process.env.JAWSDB_URL) {
//   connection = new Sequelize(process.env.JAWSDB_URL);
// } else {
//   const pwd = "su7tnven"
//   connection = new Sequelize('tomcariello', 'root', pwd, {
//     host: 'localhost',
//     dialect: 'mysql',
//     port: '3306',
//   });
// }

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const moment = require('moment');

const app = express();
require('./config/passportConfig.js')(passport);

// Serve static content for the app from the "public" directory in the application directory.
app.use('/public', express.static(`${__dirname}/public`));

app.use(cookieParser()); // read cookies

app.use(bodyParser.urlencoded({ // read data from forms
  extended: false,
}));

const exphbs = require('express-handlebars'); // for templating

app.set('view engine', 'handlebars');

app.engine('handlebars', exphbs.engine({
  defaultLayout: 'main',
  helpers: {
    formatdate(datetime, format) {
      if (moment) {
        return moment(datetime).format('DD MMMM - YYYY');
      }
      return datetime;
    },
    limittext(data) {
      data = decodeURIComponent(data);
      return `${data.substring(0, 400)}...`;
    },
    decodeSummernote(data) {
      return data = decodeURIComponent(data);
    },
  },
}));

require('./config/passportConfig.js');

// Passport configuration
app.use(session({
  secret: 'tomtest', // session secret
  resave: true,
  saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions


const routes = require('./controllers/route_controller.js');

app.use('/', routes);

const PORT = process.env.PORT || 3000;
db.sequelize.sync({ force: false }).then(() => {
  app.listen(PORT, () => {
    console.log(`==> 🌎  Listening on port ${PORT}.`);
  });
}).catch((err) => {
  console.error("Unable to connect to the database:", err);
});
