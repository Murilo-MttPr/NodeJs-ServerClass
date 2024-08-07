const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const { graphqlHTTP } = require('express-graphql');

const cors = require('cors');
const graphqlSchema = require('./graphql/schema');
const graphqlResolvers = require('./graphql/resolvers')
const auth = require('./middleware/auth')
const { clearImage } = require('./util/file')

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

// Midleware de autenticação:
app.use(auth);
// Definir aqui, o app vai ate la e verifica q auth esta como 'false' antes de continuar o codigo aqui no coraação do servidor. Ai por la o codigo segue oqq esta escrito e tals


app.put('/post-image', (req, res, next) => {
  if (!req.isAuth) {
    throw new Error('Usuário não autenticado');
  }
  if (!req.file && !req.body.oldPath) {
    return res.status(200).json({ message: 'Nenhum arquivo selecionado e nenhum caminho antigo fornecido' });
  }
  if (req.body.oldPath) {
    clearImage(req.body.oldPath);
  }
  return res.status(201).json({ message: 'Arquivo guardado', filePath: req.file ? req.file.path.replace("\\", "/") : null });
});


app.use('/graphql', graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolvers,
    graphiql: true,
    //Tratamento de erro:
    customFormatErrorFn(err) {
      if (!err.originalError){
        return err;
      }
      const data = err.originalError.data;
      const message = err.message || 'Um erro aconteceu.';
      const code = err.originalError.code || 500;
      return { message: message, status: code, data: data }
    }
}))

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
    app.listen(8080);
  })
  .catch(err => {
    console.log(err);
  });

  