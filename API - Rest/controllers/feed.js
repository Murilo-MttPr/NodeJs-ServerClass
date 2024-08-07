const fs = require('fs')
const path = require('path')
const {validationResult} = require('express-validator')

const io = require('../socket')
const Post = require('../models/post');
const User = require('../models/user');
const Status = require('../models/status');

exports.getPosts = async (req, res, next) => {
    const currentPage = req.query.page || 1;
    const perPage = 2;
    try {
    const totalItems = await Post.find().countDocuments()
    const posts = await Post.find()
        .populate('creator')
        .sort({ createdAt: -1 })
        .skip((currentPage -1) * perPage)
        .limit(perPage)

        res.status(200).json({message: '', posts: posts, totalItems: totalItems})
    } catch (err) {
        if (!err.statusCode){
            err.statusCode = 500
         }
        next(err)
    }
};

exports.createPost = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validação falhou. Algo está incorreto');
        error.statusCode = 422;
        throw error;
    }
    if (!req.file) {
        const error = new Error('Nenhuma imagem selecionada');
        error.statusCode = 422;
        throw error;
    }
    const imageUrl = req.file.path.replace("\\", "/");
    const title = req.body.title;
    const content = req.body.content;
    let creator;
    const post = new Post({
        title: title,
        content: content,
        imageUrl: imageUrl,
        creator: req.userId,
    });

    try {
        await post.save();
        const user = await User.findById(req.userId);
        user.posts.push(post);
        await user.save();
        creator = user; // Atribuindo o usuário encontrado à variável creator
        io.getIO().emit('posts', { action: 'create', post: post }); // Atualizando os clientes
        res.status(201).json({
            message: 'Post criado com sucesso!',
            post: post,
            creator: { _id: creator._id, name: creator.name }
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};


exports.getPost = async (req,res,next) => {
    const postId = req.params.postId;
    const post = await Post.findById(postId)
    try {
        if (!post) {
            const error = new Error('Post nao encontrado');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({ message: 'Post fetched', post: post})
    
    } catch(err) {
        if (!err.statusCode){
            err.statusCode = 500
         }
        next(err)
        }
}

exports.updatePost = async (req, res, next) => {
    const postId = req.params.postId;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validação falhou. Algo está incorreto');
        error.statusCode = 422;
        throw error;
    }
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image; //Se nenhuma imagem for inserida, mantem a atual;

    //Se colocarmos uma nova imagem:
    if (req.file) {
        // imageUrl = req.file.path;
        imageUrl = req.file.path.replace("\\", "/");
    }

    //Se até aqui não tiver imagem alguma:
    if (!imageUrl) {
        const error = new Error('Nenhum arquivo selecionado');
        error.statusCode = 422;
        throw error;
    }
    try {
    const post = await Post.findById(postId).populate('creator')

            if (!post) {
                const error = new Error('Post não encontrado');
                error.statusCode = 404;
                throw error;
            }
            if (post.creator._id.toString() !== req.userId){
                const error = new Error ('nao autorizado');
                error.statusCode = 403;
                throw error
            }
            if (imageUrl !== post.imageUrl) {
                clearImage(post.imageUrl);
            }
            post.title = title;
            post.imageUrl = imageUrl;
            post.content = content;
            const result = await post.save();
        io.getIO().emit('posts', {action: 'update', post: result})
            res.status(200).json({ message: 'Post atualizado', post: result });
        
    } catch(err){
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        };
};

exports.deletePost = async (req, res, next) => {
    const postId = req.params.postId;
    try {
        console.log(`Procurando post com ID: ${postId}`);
        const post = await Post.findById(postId);
        
        if (!post) {
            const error = new Error('Post não encontrado');
            error.statusCode = 404;
            throw error;
        }
        if (post.creator.toString() !== req.userId) {
            const error = new Error('Não autorizado');
            error.statusCode = 403;
            throw error;
        }
        clearImage(post.imageUrl);
        await Post.findByIdAndDelete(postId);

        const user = await User.findById(req.userId); // Certifique-se de que req.userId está correto
        user.posts.pull(postId);
        await user.save();
        io.getIO().emit('posts', { action: 'delete', post: postId })
        res.status(200).json({ message: 'Post deletado' });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath);
    fs.access(filePath, fs.constants.F_OK, err => {
        if (err) {
            console.log(`Arquivo não encontrado: ${filePath}`);
            return;
        }
        fs.unlink(filePath, err => {
            if (err) {
                console.log(`Erro ao deletar arquivo: ${err}`);
            } else {
                console.log(`Arquivo deletado: ${filePath}`);
            }
        });
    });
};
