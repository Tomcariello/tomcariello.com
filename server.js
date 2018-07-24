var dotenv = require('dotenv').config();

//Set up the server to use mySQL locally & Jaws once deployed
var Sequelize = require('sequelize'),
  connection;
if (process.env.JAWSDB_URL){
  connection = new Sequelize(process.env.JAWSDB_URL);
} else{
  connection = new Sequelize('tomcariello', 'root', 'password', {
    host: 'localhost',
    dialect: 'mysql',
    port:'3306'
  })
}

var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var session = require('express-session');
var moment = require('moment');

var app = express();
require('./config/passportConfig.js')(passport);

// Serve static content for the app from the "public" directory in the application directory.
app.use("/public", express.static(__dirname + '/public'));

app.use(cookieParser()); //read cookies

app.use(bodyParser.urlencoded({ //read data from forms
	extended: false
}));

var exphbs = require('express-handlebars'); //for templating

app.set('view engine', 'handlebars');

app.engine('handlebars', exphbs({
  defaultLayout: 'main',
  helpers: {
    'formatdate': function(datetime,format) {
      if (moment) {
        return moment(datetime).format("DD MMMM - YYYY");
      } else {
        return datetime;
      }
    },
    'limittext': function(data) {
      data = decodeURIComponent(data);
      return data.substring(0,400) + "...";
    },
    'decodeSummernote': function(data) {
      return data = decodeURIComponent(data);
    }
  }
}));

require('./config/passportConfig.js');

//Passport configuration
app.use(session({ 
  secret: 'tomtest', // session secret
  resave: true,
  saveUninitialized: true
 })); 
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions


//Routes
var routes = require('./controllers/route_controller.js');
app.use('/', routes);

//Launch
var PORT = 3000;
app.listen(process.env.PORT || PORT);
