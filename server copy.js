const mongoose = require('mongoose')
const Document = require('./Document')

const express = require('express')
const expr = express() 
const http = require('http')
const server = http.createServer(expr)
const PORT = process.env.PORT || 5000


/*  connect to local MongoDB
mongoose.connect('mongodb://localhost/qdoc', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true
});
*/
mongoose.connect('mongodb+srv://yale918:74918@cluster0.ewsiy.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true
});
mongoose.connection.on('connected',()=>{
  console.log("#Qdoc: connected to mongo yeahh")
})


const io = require('socket.io')(3001, {
  cors: {
    origin: 'http://localhost:5000',
    methods: ['GET', 'POST']
  },
})

if(process.env.NODE_ENV == "production"){
  console.log("in prod")
  expr.use(express.static('client/build'))
  const path = require('path')
  expr.get("*",(req,res)=>{
    res.sendFile(path.resolve(__dirname,'client','build','index.html'))
  })
}
else{
  console.log("in dev")
  expr.use(express.static('client/build'))
  const path = require('path')
  expr.get("*",(req,res)=>{
    res.sendFile(path.resolve(__dirname,'client','build','index.html'))
  })
}


//const io = require('socket.io')(server)


const defaultValue = ""

io.on("connection", socket => {
  console.log("socket.io connected")
  socket.on('get-document', async documentId => {
    const document = await findOrCreateDocument(documentId)
    socket.join(documentId)
    socket.emit('load-document', document.data)

    socket.on('send-changes', delta => {
      socket.broadcast.to(documentId).emit("receive-changes", delta)
    })

    socket.on("save-document", async data =>{
      await Document.findByIdAndUpdate(documentId, { data })
    })
  })
})

async function findOrCreateDocument(id) {
  if (id == null) return

  const document = await Document.findById(id)
  if (document) return document
  return await Document.create({ _id: id, data: defaultValue })
}


/*
  console.log("hello")
  expr.use(express.static('client/build'))
  const path = require('path')
  expr.get("*",(req,res)=>{
    res.sendFile(path.resolve(__dirname,'client','build','index.html'))
  })
*/





server.listen(PORT,()=>{
  console.log("#server: static_S is listening on port: ",5000)
})