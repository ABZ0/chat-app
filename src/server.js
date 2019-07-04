const app = require("./app");
const http = require("http");
const socketio = require("socket.io");
const Filter = require("bad-words");
const {
    generateMessage,
    generateLocationMessage
} = require("./utils/messages");
const {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
} = require("./utils/users");
const port = process.env.PORT;

// Setup socket.io server (io)
const server = http.createServer(app);
const io = socketio(server);

const admin = "admin";
const welcomeMessage = "Welcome!";

// Respond to the connection event from the server
io.on("connection", socket => {
    // SECTION  Send in specific room
    socket.on("join", ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room });
        if (error) {
            return callback(error);
        }

        socket.join(user.room);

        // NOTE Send to one specific connection
        socket.emit("serverMessage", generateMessage(admin, welcomeMessage));

        // NOTE Send to all users except one specific connection
        socket.broadcast
            .to(user.room)
            .emit(
                "serverMessage",
                generateMessage(admin, `${user.username} has joined!`)
            );

        io.to(user.room).emit("roomData", {
            room: user.room,
            users: getUsersInRoom(user.room)
        });
        callback();
    });

    // SECTION  Send to every connection
    socket.on("sendMessage", (message, callback) => {
        // const filter = new Filter();
        // if (filter.isProfane(message)) {
        //     return callback("Profanity is not allowed!");
        // }
        const user = getUser(socket.id);
        io.to(user.room).emit(
            "serverMessage",
            generateMessage(user.username, message)
        );
        callback("Delivered!");
    });

    socket.on("disconnect", () => {
        const user = removeUser(socket.id);
        if (user) {
            io.to(user.room).emit(
                "serverMessage",
                generateMessage(admin, `${user.username} has left!`)
            );

            io.to(user.room).emit("roomData", {
                room: user.room,
                users: getUsersInRoom(user.room)
            });
        }
    });

    socket.on("sendLocation", (url, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit(
            "locationMessage",
            generateLocationMessage(user.username, url)
        );
        callback();
    });
});

server.listen(port, () => {
    console.log(`Server is up on ===> http://localhost:${port}`);
});
