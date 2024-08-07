const validator = require('validator')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')


const User = require('../models/user')
const Post = require('../models/post')
const { clearImage } = require('../util/file')

module.exports = {
    createUser: async function ({ userInput }, req) {
        // const email = args.userInput.email // Um jeito de fazer
        const errors = []
        // Validação:
        if (!validator.isEmail(userInput.email)) {
            errors.push({ message: 'Email invalido' })
        }
        if (validator.isEmpty(userInput.password) || !validator.isLength(userInput.password, { min: 5 })) {
            errors.push({ message: 'Senha muito curta' })
        }
        if (errors.length > 0) {
            const error = new Error('Imputs invalidos');
            error.data = errors;
            error.code = 422;
            throw error;
        }
        const existingUser = await User.findOne({ email: userInput.email });
        if (existingUser) {
            const error = new Error('User ja existe')
            throw error;
        }
        const hashedPw = await bcrypt.hash(userInput.password, 12);
        const user = new User({
            email: userInput.email,
            name: userInput.name,
            password: hashedPw
        });
        const createdUser = await user.save()
        return { ...createdUser._doc, _id: createdUser._id.toString() }
    },
    login: async function ({ email, password }) {
        const user = await User.findOne({ email: email });
        if (!user) {
            const error = new Error('usurio nao encontrado');
            error.code = 401;
            throw error;
        }
        const isEqual = await bcrypt.compare(password, user.password);
        if (!isEqual) {
            const error = new Error('Senha errada');
            error.code = 401;
            throw error;
        }
        const token = jwt.sign({
            userId: user._id.toString(),
            email: user.email
        }, 'senhaSecreta', { expiresIn: '1h' }
        );
        return { token: token, userId: user._id.toString() }
    },
    createPost: async function ({ postInput }, req) {
        // Autenticação do usuario:
        if (!req.isAuth) {
            const error = new Error('Nao autenticado');
            error.code = 401
            throw error;
        }
        //Validação de dados (input):
        const errors = []
        if (validator.isEmpty(postInput.title) || !validator.isLength(postInput.title, { min: 3 })) {
            errors.push({ message: 'Titulo invalido' })
        }
        if (validator.isEmpty(postInput.content) || !validator.isLength(postInput.content, { min: 5 })) {
            errors.push({ message: 'Descrição invalida' })
        }
        if (errors.length > 0) {
            const error = new Error('Imputs invalidos');
            error.data = errors;
            error.code = 422;
            throw error;
        }
        // Definindo usuario para armazenar os dados no produto:
        const user = await User.findById(req.userId);
        if (!user) {
            const error = new Error('Usuario invalido');
            error.code = 401;
            throw error;
        }
        // Construindo o novo produto:
        const post = new Post({
            title: postInput.title,
            content: postInput.content,
            imageUrl: postInput.imageUrl.replace("\\", "/"),
            creator: user
        })

        const createdPost = await post.save(); //Salva os dados no documento post do DB e passa esses dados para a variavel criada.
        user.posts.push(createdPost); // Adiciona o post criado (createdPost) na array de posts do usuario.
        await user.save(); // Salva as alterações do usuario no DB (o novo post no caso)
        return {
            ...createdPost._doc,
            _id: createdPost._id.toString(), // Convertendo o id do post em uma string para ser utilizada por APIs ja que no Mongo sao objetos.
            createdAt: createdPost.createdAt.toISOString(),
            updatedAt: createdPost.updatedAt.toISOString()
        };
    },
    // posts é a pagina principal onde esta todos os produtos.
    posts: async function ({ page }, req) {
        // Autenticação do usuario: 
        if (!req.isAuth) {
            const error = new Error('Not authenticated!');
            error.code = 401;
            throw error;
        }
        // Paginação:
        if (!page) {
            page = 1;
        }
        const perPage = 2;
        const totalPosts = await Post.find().countDocuments();
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .skip((page - 1) * perPage)
            .limit(perPage)
            .populate('creator');
        return {
            posts: posts.map(p => {
                return {
                    ...p._doc,
                    _id: p._id.toString(),
                    createdAt: p.createdAt.toISOString(),
                    updatedAt: p.updatedAt.toISOString()
                };
            }),
            totalPosts: totalPosts
        };
    },
    // Post é a visualisação de um post especifico.
    post: async function ({ id }, req) {
        //Autenticação do usuario: 
        if (!req.isAuth) {
            const error = new Error('Nao autenticado');
            error.code = 401
            throw error;
        }
        //Encontrando o post do usuario:
        const post = await Post.findById(id).populate('creator');
        if (!post) {
            const error = new Error('No post found');
            error.code = 404;
            throw error;
        }
        return {
            ...post._doc,
            createdAt: post.createdAt.toISOString(),
            updatedAt: post.updatedAt.toISOString()
        }
    },
    updatePost: async function ({ id, postInput }, req) {
        if (!req.isAuth) {
            const error = new Error('Not authenticated!');
            error.code = 401;
            throw error;
        }
        const post = await Post.findById(id).populate('creator');
        if (!post) {
            const error = new Error('No post found');
            error.code = 404;
            throw error;
        }
        if (post.creator._id.toString() !== req.userId.toString()) {
            const error = new Error('Not authorized');
            error.code = 403;
            throw error;
        }
    
        const errors = [];
        if (validator.isEmpty(postInput.title) || !validator.isLength(postInput.title, { min: 3 })) {
            errors.push({ message: 'Invalid title' });
        }
        if (validator.isEmpty(postInput.content) || !validator.isLength(postInput.content, { min: 5 })) {
            errors.push({ message: 'Invalid content' });
        }
        if (errors.length > 0) {
            const error = new Error('Invalid inputs');
            error.data = errors;
            error.code = 422;
            throw error;
        }
    
        post.title = postInput.title;
        post.content = postInput.content;
    
        if (postInput.imageUrl !== 'undefined' && postInput.imageUrl !== post.imageUrl) {
            clearImage(post.imageUrl);  // Clear the old image
            post.imageUrl = postInput.imageUrl;  // Set the new image URL
        }
    
        const updatedPost = await post.save();
    
        return {
            ...updatedPost._doc,
            _id: updatedPost._id.toString(),
            createdAt: updatedPost.createdAt.toISOString(),
            updatedAt: updatedPost.updatedAt.toISOString()
        };
    },
    deletePost: async function({ id }, req) {
        if (!req.isAuth) {
          const error = new Error('Not authenticated!');
          error.code = 401;
          throw error;
        }
      
        try {
          const post = await Post.findById(id);
          if (!post) {
            const error = new Error('No post found!');
            error.code = 404;
            throw error;
          }
          if (post.creator.toString() !== req.userId.toString()) {
            const error = new Error('Not authorized!');
            error.code = 403;
            throw error;
          }
      
          clearImage(post.imageUrl);
      
          // Remova a postagem do banco de dados
          await Post.findByIdAndDelete(id);
          console.log(`Post with ID ${id} removed from the database.`);
      
          // Atualize o usuário removendo a referência da postagem
          const user = await User.findById(req.userId);
          user.posts.pull(id);
          await user.save();
          console.log(`Post reference removed from user ${req.userId}.`);
      
          return true;
        } catch (err) {
          console.error('Error deleting post:', err);
          throw err;
        }
    },
    user: async function(args, req) {
        //Autenticando o usuario:
        if (!req.isAuth) {
            const error = new Error('Not authenticated!');
            error.code = 401;
            throw error;
        }
        const user = await User.findById(req.userId);
        if (!user) {
            const error = new Error('Nenhum usuario encontrado');
            error.code = 404;
            throw error;
        }
        return { ...user._doc, id: user._id.toString() };
    },
    updateStatus: async function({status}, req) {
        //Autenticando o usuario:
        if (!req.isAuth) {
            const error = new Error('Not authenticated!');
            error.code = 401;
            throw error;
        }
        const user = await User.findById(req.userId);
        if (!user) {
            const error = new Error('Nenhum usuario encontrado');
            error.code = 404;
            throw error;
        }
        user.status = status;
        await user.save();
        return {
            ...user._doc,
            _id: user._id.toString()
        }
    }
};