'use strict';

    // ProjectName: DataTypes.STRING,
    // ProjectBlurb: DataTypes.STRING,
    // ProjectURL: DataTypes.STRING,
    // ProjectIMG: DataTypes.STRING

module.exports = {
  up: function (queryInterface, Sequelize) {

      return queryInterface.bulkInsert('projects', [
      {
        ProjectName: 'Hangman JS',
        ProjectBlurb: "Written in javascript, this is my take on the classic game.",
        ProjectURL: "https://glacial-ravine-73524.herokuapp.com/",
        GithubURL: "https://github.com/Tomcariello/Week11-Hangman",
        ProjectIMG: "hangman.png",
        createdAt: "2016-12-01 00:00:00",
        updatedAt: "2016-12-01 00:00:00"
      },
      {
        ProjectName: 'Quiz Game',
        ProjectBlurb: "This javascript game uses timers and click events to track a user through an MMA related quiz.",
        ProjectURL: "https://intense-taiga-34415.herokuapp.com/",
        GithubURL: "https://github.com/Tomcariello/triviagame",
        ProjectIMG: "quiz.png",
        createdAt: "2016-12-01 00:00:00",
        updatedAt: "2016-12-01 00:00:00"
      },
      {
        ProjectName: 'Giphy API Search',
        ProjectBlurb: "Using JQuery and AJAX, clicking on a button at the top of the screen will find related images through an API on Giphy.com. Clicking a resulting image will animate the gif. You can add new search terms using the form.",
        ProjectURL: "http://calm-waters-91764.herokuapp.com/",
        GithubURL: "https://github.com/Tomcariello/api_homework.git",
        ProjectIMG: "ajax.png",
        createdAt: "2016-12-01 00:00:00",
        updatedAt: "2016-12-01 00:00:00"
      },
      {
        ProjectName: 'Rock Paper Scissors',
        ProjectBlurb: "This web based take on the classic game uses JS & Firebase to link two users in a fight of epic proportion.",
        ProjectURL: "http://salty-waters-46884.herokuapp.com/",
        GithubURL: "https://github.com/Tomcariello/RPS-Multiplayer",
        ProjectIMG: "rps.png",
        createdAt: "2016-12-01 00:00:00",
        updatedAt: "2016-12-01 00:00:00"
      },
            {
        ProjectName: 'Friend Finder',
        ProjectBlurb: "This node server uses express to handle routes and JS to find the closest match to your answers in the database.",
        ProjectURL: "https://floating-lowlands-56191.herokuapp.com/",
        GithubURL: "https://github.com/Tomcariello/FriendFinder",
        ProjectIMG: "friend.png",
        createdAt: "2016-12-01 00:00:00",
        updatedAt: "2016-12-01 00:00:00"
      },
      {
        ProjectName: 'Burger Game',
        ProjectBlurb: "This Node/Express/MySQL CRUD app allows you to create a burger and then devour it.",
        ProjectURL: "http://still-wildwood-42367.herokuapp.com/burgers",
        GithubURL: "https://github.com/Tomcariello/burger",
        ProjectIMG: "burger.png",
        createdAt: "2016-12-01 00:00:00",
        updatedAt: "2016-12-01 00:00:00"
      }

      ], {});

  },

  down: function (queryInterface, Sequelize) {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkDelete('Person', null, {});
    */
  }
};
