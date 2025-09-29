export function attachSocket(io) {
  io.on("connection", (socket) => {
    // Expect client to emit 'identify' with patientId after auth
    socket.on("identify", (patientId) => {
      if (patientId) {
        socket.join(patientId);
      }
    });
  });
}
