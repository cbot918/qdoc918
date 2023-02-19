const mongoose = require("mongoose");
const Document = require("./Document");

const express = require("express");
const expr = express();
const http = require("http");
const server = http.createServer(expr);
const PORT = process.env.PORT || 5000;

const { MONGOURI } = require("./config/key");

mongoose.connect(MONGOURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});
mongoose.connection.on("connected", () => {
  console.log("#Qdoc: connected to mongo yeahh");
});

const { Server } = require("socket.io");
const io = new Server(server);

expr.use(express.static("client/build"));
const path = require("path");
expr.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
});

const defaultValue = "";

io.on("connection", (socket) => {
  console.log("socket.io connected");
  socket.on("get-document", async (documentId) => {
    const document = await findOrCreateDocument(documentId);
    socket.join(documentId);
    socket.emit("load-document", document.data);

    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    socket.on("save-document", async (data) => {
      await Document.findByIdAndUpdate(documentId, { data });
    });
  });
});

async function findOrCreateDocument(id) {
  if (id == null) return;

  const document = await Document.findById(id);
  if (document) return document;
  return await Document.create({ _id: id, data: defaultValue });
}

server.listen(PORT, () => {
  console.log("qchat918 listening on port: ", 5000);
});
