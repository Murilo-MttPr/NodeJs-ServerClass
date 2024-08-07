// const path = require('path');
// const express = require('express');
// const bodyParser = require('body-parser');
// const mongoose = require('mongoose');
// const multer = require('multer');

// const feedRoutes = require('./routes/feed');
// const authRoutes = require('./routes/auth');

// const app = express();
// app.use(bodyParser.json());

// const fileStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'images');
//   },
//   filename: (req, file, cb) => {
//     const date = new Date().toISOString().replace(/:/g, '-');
//     cb(null, date + '-' + file.originalname);
//   }
// });

// const fileFilter = (req, file, cb) => {
//   if (
//     file.mimetype === 'image/png' ||
//     file.mimetype === 'image/jpg' ||
//     file.mimetype === 'image/jpeg'
//   ) {
//     cb(null, true);
//   } else {
//     cb(null, false);
//   }
// };

// app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));

// app.use('/images', express.static(path.join(__dirname, 'images'))); // Deixando /images estático para ser usado

// // Middleware para adicionar cabeçalhos CORS
// app.use((req, res, next) => {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//   if (req.method === 'OPTIONS') {
//     return res.sendStatus(200); 
//   }
//   next();
// });

// app.use('/feed', feedRoutes);
// app.use('/auth', authRoutes);

// app.use((error, req, res, next) => {
//   console.log(error);
//   const status = error.statusCode || 500;
//   const message = error.message;
//   const data = error.data;
//   res.status(status).json({ message: message , data: data});
// });

// mongoose.connect('mongodb+srv://mottapradoestudos:j2490E3PxAg3yJe1@cluster0.kwspleu.mongodb.net/messages?retryWrites=true&w=majority&appName=Cluster0')
//   .then(result => {
//     const server = app.listen(8080);
//     const io = require('./socket').init(server); // Usando socket.io
//     io.on('connection', socket => {
//       console.log('Cliente conectado')
//     })
//   })
//   .catch(err => {
//     console.log(err);
//   });

const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');

const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');

const app = express();
app.use(bodyParser.json());

// Configuração do armazenamento de arquivos com multer
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    const date = new Date().toISOString().replace(/:/g, '-');
    cb(null, date + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));

// Configuração do CORS
app.use(cors()); // Permitir todas as origens. Para configuração específica, passe um objeto de configuração.

// Deixar /images estático para ser usado
app.use('/images', express.static(path.join(__dirname, 'images')));

// Middleware para adicionar cabeçalhos CORS (não necessário com cors middleware, mas mostrado como exemplo de configuração manual)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200); 
  }
  next();
});

app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message , data: data });
});

mongoose.connect('mongodb+srv://mottapradoestudos:j2490E3PxAg3yJe1@cluster0.kwspleu.mongodb.net/messages?retryWrites=true&w=majority&appName=Cluster0')
  .then(result => {
    const server = app.listen(8080);
    const io = require('./socket').init(server); // Usando socket.io
    io.on('connection', socket => {
      console.log('Cliente conectado');
      socket.on('disconnect', () => {
        console.log('Cliente desconectado');
      });
    });
  })
  .catch(err => {
    console.log(err);
  });
