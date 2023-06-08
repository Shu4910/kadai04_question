const express = require('express');
const multer  = require('multer');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketio(server);
const port = 3000;
let uploadedImages = [];

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext) // changing the file name to a timestamp
  }
})

const upload = multer({ storage: storage })

app.use(express.static('public'));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.post('/upload', upload.single('myImage'), (req, res, next) => {
  if (req.file) {
    uploadedImages.push(req.file.filename);
    // Socket.IOを使ってファイル名を送信
    io.emit('image', req.file.filename);
  }

  res.redirect('/images');
});

app.get('/images', (req, res, next) => {
  let imagesHTML = uploadedImages.map(image => `<img src="/uploads/${image}" alt="Uploaded Image" style="max-width: 200px; max-height: 200px;"/><br>`).join('');
  res.send(`
      <!DOCTYPE html>
      <html>
      <body>
      <h1>Uploaded Images</h1>
      <div id="images">${imagesHTML}</div>
      <form action="/upload" method="POST" enctype="multipart/form-data">
      <input type="file" name="myImage" accept=".png, .jpg, .jpeg">
      <input type="submit" value="Upload">
      </form>
      <script src="/socket.io/socket.io.js"></script>
      <script>
        var socket = io();
        socket.on('image', function(filename){
          var imageUrl = "/uploads/" + filename;
          var img = document.createElement('img');
          img.src = imageUrl;
          img.alt = "Uploaded image";
          document.getElementById('images').appendChild(img);
        });
      </script>
      </body>
      </html>
  `);
});

server.listen(port, () => console.log(`App is listening on port ${port}!`));
