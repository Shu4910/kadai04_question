// const express = require('express');
// const http = require('http');
// const socketIo = require('socket.io');

// const app = express();
// const server = http.createServer(app);
// const io = socketIo(server);



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


app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('a user connected');
  
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });
});

// server.listen(2000, () => {
//   console.log('listening on *:2000');
// });


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


        <button id="out">ログアウト</button>

        <ul id="messages"></ul>
        <form action="">
          <input id="m" autocomplete="off" /><button>Send</button>
        </form>


        <div id="images">${imagesHTML}</div>
        <form action="/upload" method="POST" enctype="multipart/form-data">
        <input type="file" name="myImage" accept=".png, .jpg, .jpeg">
        <input type="submit" value="Upload">
        </form>



        <script src="/socket.io/socket.io.js"></script>
        <script src="https://code.jquery.com/jquery-1.11.1.js"></script>

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

        <script>
          $(function () {
            var socket = io();
            $('form').submit(function(e){
              e.preventDefault(); 
              socket.emit('chat message', $('#m').val());
              $('#m').val('');
              return false;
            });
    
            socket.on('chat message', function(msg){
              $('#messages').append($('<p>').text(msg));
            });
          });
    
          //###############################################
          //Logout処理
          //###############################################
          $("#out").on("click", function () {
              // signInWithRedirect(auth, provider);
              window.location.href='index.html';
              // signOut(auth).then(() => {
              //     // Sign-out successful.
              //     console.log("Fuction");
              // }).catch((error) => {
              //     // An error happened.
              //     console.error(error);
              //     console.log("Not func");
              // });
          });
    
        </script>


        </body>
        </html>
    `);
  });
  
  server.listen(port, () => console.log(`App is listening on port ${port}!`));
  