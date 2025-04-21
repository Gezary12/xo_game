const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files for the game (frontend)
app.use(express.static("public"));

let players = [];
let board = Array(9).fill(null); // Game board
let currentPlayer = 0; // 0 for player 1, 1 for player 2

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  if (players.length < 2) {
    players.push(socket.id);
    socket.emit("player-assign", { player: players.length - 1 });
    console.log(Player ${players.length} assigned: ${socket.id});
  }

  if (players.length === 2) {
    io.emit("game-start", { message: "Game has started!" });
  }

  // Handle a player's move
  socket.on("make-move", (data) => {
    if (players[currentPlayer] === socket.id) {
      const { index } = data;
      if (board[index] === null) {
        board[index] = currentPlayer === 0 ? "X" : "O";
        io.emit("update-board", { board });

        // Check for win or draw
        if (checkWin(board)) {
          io.emit("game-over", { winner: currentPlayer });
          resetGame();
        } else if (board.every((cell) => cell !== null)) {
          io.emit("game-over", { winner: null }); // Draw
          resetGame();
        } else {
          currentPlayer = 1 - currentPlayer; // Switch turn
          io.emit("switch-turn", { player: currentPlayer });
        }
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    players = players.filter((player) => player !== socket.id);
    if (players.length < 2) {
      io.emit("player-disconnected", { message: "Player disconnected. Game over." });
      resetGame();
    }
  });
});

function resetGame() {
  board = Array(9).fill(null);
  currentPlayer = 0;
  players = [];
}

function checkWin(board) {
  const winningCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  return winningCombinations.some(
    (combination) =>
      board[combination[0]] !== null &&
      board[combination[0]] === board[combination[1]] &&
      board[combination[1]] === board[combination[2]]
  );
}

server.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});