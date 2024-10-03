function handleMessage(socket) {
  socket.on("message", (msg) => {
    console.log("Received message:", msg);
  });
}

module.exports = handleMessage;
