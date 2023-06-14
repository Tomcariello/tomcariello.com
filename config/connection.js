// Here is where you make the connection to the database and export and used by the O.R.M.
const mysql = require('mysql');

let connection;

if (process.env.JAWSDB_URL) {
  connection = mysql.createConnection(process.env.JAWSDB_URL);
} else {
  connection = mysql.createConnection({
    port: 3306,
  	host: 'localhost',
  	user: 'root',
    password: process.env.localpassword,
    database: 'tomcariello',
  });
}

connection.connect((err) => {
 	if (err) {
 		console.error(`error connecting: ${err.stack}`);
 		return;
 	}
 	console.log(`connected as id ${connection.threadId}`);
});

module.exports = connection;
