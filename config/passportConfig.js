var connection = require('../config/connection.js');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt');


// load up the user model
var User = require('../models/userschema.js');

// expose this function to our app using module.exports
module.exports = function(passport) {

    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        connection.query("SELECT * FROM users WHERE id = ? ",[id], function(err, rows){
            done(err, rows[0]);
        });
    });
    

    //=======================
    //== Register New User ==
    //=======================
    passport.use('local-signup', new LocalStrategy({
        usernameField : 'email',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },

    function(req, email, password, done) {

        //Create MySQL query string using the email provided
        var emailQuery = 'SELECT * FROM users WHERE email = "' + email + '"';

        //connect to MySQL and search for the username
        connection.query(emailQuery, function(err, rows) {

            if (err)
                return done(err);
            if (rows.length) {
                console.log('User with this email found. Redirecting to "Login" page');
                return done(null, false);
            } else { // if there is no user with that username create the user

                var newUserMysql = {
                    firstname: req.body.firstname,
                    lastname: req.body.lastname,
                    email: email,
                    password: bcrypt.hashSync(password, bcrypt.genSaltSync(9), null),  // use the generateHash function in our user model
                    //createdAt: CURDATE(), -- Not working
                    //updatedAt: CURDATE() -- Not working
                 };

                //Update string to populate registration information
                var insertQuery = "INSERT INTO users (firstname, lastname, email, password) values (?,?,?,?)";

                //Connect 
                connection.query(insertQuery,[newUserMysql.firstname, newUserMysql.lastname, newUserMysql.email, newUserMysql.password],function(err, rows) {
                    newUserMysql.id = rows.insertId;

                    return done(null, newUserMysql);
                });
            }
        });
    }))

    //=======================
    //== Login User =========
    //=======================

    passport.use(
        'local-login',
        new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField : 'email',
            passwordField : 'password',
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, email, password, done) { // callback with email and password from our form

            var emailQuery = 'SELECT * FROM users WHERE email = "' + email + '"';

            connection.query(emailQuery, function(err, rows){
                if (err) {
                    console.log('Error recieved');
                    return done(err);
                }
                if (!rows.length) {
                    console.log('User not found');
                    return done(null, false); //User not found
                }

                // if the user is found but the password is wrong
                if (!bcrypt.compareSync(password, rows[0].password)) {
                    console.log('Invalid Password');
                    return done(null, false); 
                }

                // all is well, return successful user
                console.log('User found, proceed!');
                return done(null, rows[0]);
            });
        })
    );
};