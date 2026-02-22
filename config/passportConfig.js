const LocalStrategy = require('passport-local').Strategy;
const db = require('../models'); // This loads your modernized models/index.js

module.exports = (passport) => {
  // 1. Serialize: Store the user ID in the session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // 2. Deserialize: Look up the user by ID when they return
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await db.users.findByPk(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });

  // =======================
  // == Register New User ==
  // =======================
  passport.use('local-signup', new LocalStrategy({
    usernameField: 'email',
    passReqToCallback: true 
  }, async (req, email, password, done) => {
    try {
      // Check if email already exists using Sequelize
      const existingUser = await db.users.findOne({ where: { email: email } });
      
      if (existingUser) {
        return done(null, false, { message: 'That email is already taken.' });
      }

      // Create new user (Sequelize handles the INSERT and timestamps)
      const newUser = await db.users.create({
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: email,
        password: db.users.generateHash(password) // Using our model's helper
      });

      return done(null, newUser);
    } catch (err) {
      return done(err);
    }
  }));

  // =======================
  // == Login User =========
  // =======================
  passport.use('local-login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  }, async (req, email, password, done) => {
    try {
      const user = await db.users.findOne({ where: { email: email } });

      if (!user) {
        console.log('User not found');
        return done(null, false);
      }

      // Using the instance method we added to the User model prototype
      if (!user.validatePassword(password)) {
        console.log('Invalid Password');
        return done(null, false);
      }

      console.log('User found, proceed!');
      return done(null, user);
    } catch (err) {
      console.log('Login Error:', err);
      return done(err);
    }
  }));
};