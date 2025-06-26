const express = require("express");
const socket = require("socket.io");
const http = require("http");
const path = require("path");
const { Chess } = require("chess.js");

const app = express();
const server = http.createServer(app);
const io = socket(server);
const chess = new Chess();

let players = {};

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index", { title: "chess game" });
});

io.on("connection", (socket) => {
  if (!players.white) {
    players.white = socket.id;
    socket.emit("playerRole", "w");
  } else if (!players.black) {
    players.black = socket.id;
    socket.emit("playerRole", "b");
  } else {
    socket.emit("spectatorRole");
  }

  socket.emit("boardState", chess.fen());

  socket.on("move", (move) => {
    if ((chess.turn() === "w" && socket.id !== players.white) ||
        (chess.turn() === "b" && socket.id !== players.black)) {
      return;
    }

    const result = chess.move(move);
    if (result) {
      io.emit("move", move);
      io.emit("boardState", chess.fen());
    } else {
      socket.emit("invalidMove", move);
    }
   
  });

  socket.on("disconnect", () => {
    if (socket.id === players.white) delete players.white;
    if (socket.id === players.black) delete players.black;
  });
});

server.listen(300, () => {
  console.log("Server running at http://localhost:300");
});
