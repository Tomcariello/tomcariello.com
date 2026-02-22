'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    return queryInterface.bulkInsert('projects', [
      {
        ProjectName: 'Hangman JS',
        ProjectBlurb: 'Written in javascript, this is my take on the classic game.',
        ProjectURL: 'https://glacial-ravine-73524.herokuapp.com/',
        GithubURL: 'https://github.com/Tomcariello/Week11-Hangman',
        ProjectIMG: 'hangman.png',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        ProjectName: 'Quiz Game',
        ProjectBlurb: 'This javascript game uses timers and click events to track a user through an MMA related quiz.',
        ProjectURL: 'https://intense-taiga-34415.herokuapp.com/',
        GithubURL: 'https://github.com/Tomcariello/triviagame',
        ProjectIMG: 'quiz.png',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        ProjectName: 'Giphy API Search',
        ProjectBlurb: 'Using JQuery and AJAX, clicking on a button at the top of the screen will find related images through an API on Giphy.com. Clicking a resulting image will animate the gif. You can add new search terms using the form.',
        ProjectURL: 'http://calm-waters-91764.herokuapp.com/',
        GithubURL: 'https://github.com/Tomcariello/api_homework.git',
        ProjectIMG: 'ajax.png',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        ProjectName: 'Rock Paper Scissors',
        ProjectBlurb: 'This web based take on the classic game uses JS & Firebase to link two users in a fight of epic proportion.',
        ProjectURL: 'http://salty-waters-46884.herokuapp.com/',
        GithubURL: 'https://github.com/Tomcariello/RPS-Multiplayer',
        ProjectIMG: 'rps.png',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        ProjectName: 'Friend Finder',
        ProjectBlurb: 'This node server uses express to handle routes and JS to find the closest match to your answers in the database.',
        ProjectURL: 'https://floating-lowlands-56191.herokuapp.com/',
        GithubURL: 'https://github.com/Tomcariello/FriendFinder',
        ProjectIMG: 'friend.png',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        ProjectName: 'Burger Game',
        ProjectBlurb: 'This Node/Express/MySQL CRUD app allows you to create a burger and then devour it.',
        ProjectURL: 'http://still-wildwood-42367.herokuapp.com/burgers',
        GithubURL: 'https://github.com/Tomcariello/burger',
        ProjectIMG: 'burger.png',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface) {
    // This allows you to "undo" the seed
    return queryInterface.bulkDelete('projects', null, {});
  }
};
