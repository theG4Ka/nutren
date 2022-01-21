
const http = require('http');
const config = require('platformsh-config').config();
const path = require('path');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'Conectado ao chat';

// Run when client connects
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);
        socket.join(user.room);
        // Welcome current user
        socket.emit('message', formatMessage(botName, ''));

        // Broadcast when a user connects
        socket.broadcast
                .to(user.room)
                .emit(
                        'message',
                        formatMessage(botName, `${user.username} entrou no chat`)
                        );

        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });

    // Listen for chatMessage
    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    // Runs when client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if (user) {
            io.to(user.room).emit(
                    'message',
                    formatMessage(botName, `${user.username} saiu do chat`)
                    );

            // Send users and room info
//            io.to(user.room).emit('roomUsers', {
//                room: user.room,
//                users: getRoomUsers(user.room)
//            });
        }
    });
});

const server = http.createServer(function (request, response) {
    response.writeHead(200, {"Content-Type": "application/json"});
    response.end(JSON.stringify(config));
});

server.listen(config.port);

////const http = require("http");
//const config = require("platformsh-config").config();
//const mysql = require("mysql2/promise");
//
//function openConnection() {
//  const credentials = config.credentials("database");
//  return mysql.createConnection({
//    host: credentials.host,
//    port: credentials.port,
//    user: credentials.username,
//    password: credentials.password,
//    database: credentials.path
//  });
//}
//
//function createTable(connection) {
//  return connection.execute(
//    `CREATE TABLE IF NOT EXISTS platforminfo (
//      uid INT(10) NOT NULL AUTO_INCREMENT,
//      username VARCHAR(64) NULL DEFAULT NULL,
//      departname VARCHAR(128) NULL DEFAULT NULL,
//      created DATE NULL DEFAULT NULL,
//      PRIMARY KEY (uid)
//    ) DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;`
//  );
//}
//
//function insertData(connection) {
//  return connection.execute(
//    "INSERT INTO platforminfo (username, departname, created) VALUES ('platform', 'Deploy Friday', '2019-06-17')"
//  );
//}
//
//function readData(connection) {
//  return connection.query("SELECT * FROM platforminfo");
//}
//
//function dropTable(connection) {
//  return connection.execute("DROP TABLE platforminfo");
//}
//
//const server = http.createServer(async function(_request, response) {
//  // Connect to MariaDB.
//  const connection = await openConnection();
//
//  await createTable(connection);
//  await insertData(connection);
//
//  const [rows] = await readData(connection); 
//
//  const droppedResult = await dropTable(connection);
//
//  // Make the output.
//  const outputString = `Hello, World22! - A simple Node.js template for Platform.sh
//MariaDB Tests:
//* Connect and add row:
//  - Row ID (1): ${rows[0].uid}
//  - Username (platform): ${rows[0].username}
//  - Department (Deploy Friday): ${rows[0].departname}
//  - Created (2019-06-17): ${rows[0].created}
//* Delete row:
//  - Status (0): ${droppedResult[0].warningStatus}`;
//
//  response.writeHead(200, { "Content-Type": "text/plain" });
//  response.end(outputString);
//});
//
//// Get PORT and start the server
//server.listen(config.port, function() {
//  console.log(`Listening on port ${config.port}`);
//});
