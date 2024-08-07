const {validationResult} = require('express-validator')
const bcrypt = require('bcryptjs') // Pacote paraa encryptar
const jwt = require('jsonwebtoken')

const User = require('../models/user'); 
const user = require('../models/user');


//Criando um novo usuario no dataBase:
exports.signup = async (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty){
        const error = new Error('Validação falhou');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    } 
    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;
    try {
    hashedPw = await bcrypt
    .hash(password, 12)//Usando o pacote com o metodo hash

        const user = new User({
            email: email,
            password: hashedPw,
            name: name
        })
        const result = await user.save()

        res.status(201).json({message: 'User criado', userId: result._id})
    
    } catch(err) {
        if (!err.statusCode){
            err.statusCode = 500
         }
        next(err)
        }; 
};

exports.login = async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    let loadedUser;
    try{
    const user = await User.findOne({email: email})
        if (!user){ // Se o email nao for encontrado no Db:
            const error = new Error('Usuario com esse email nao foi encontrado')
            error.statusCode = 401;
            throw error
        }
        loadedUser = user;
        //Se for encontrado, comparamos entao a senha:
        const isEqual = await bcrypt.compare(password, user.password)
        if (!isEqual){ // Se a senha nao foi igual a registrada no Db:
            const error = new Error('Senha errada')
            error.statusCode = 401
            throw error
        }
        // Ao inves de usar sessions e cookies, usamos tokiens pq ficam do lado do usuario e nao no server
        const token = jwt.sign({ //Usando o token 
            email: loadedUser.email,
            userId: loadedUser._id.toString()
            }, 'senhaSecreta', {expiresIn: '1h'} //Usar expiresIn para maior segurança
        );
        res.status(200).json({token: token, userId: loadedUser._id.toString()})

    } catch(err) {
        if (!err.statusCode){
            err.statusCode = 500
         }
        next(err)
        }; 
}

exports.getUserStatus = async (req, res, next) => {
    try {
    const user = await User.findById(req.userId)
        if (!user){
            const error = new Error('Usuario nao encontrado');
            error.statusCode = 404;
            throw error
        }
        res.status(200).json({status: user.status})

    } catch(err) {
        if (!err.statusCode){
            err.statusCode = 500
         }
        next(err)
        }; 
}

exports.updateUserStatus = async (req, res, next) => {
    const newStatus = req.body.status;
    try {
    const user = await User.findById(req.userId)
        if (!user){
            const error = new Error('Usuario nao encontrado');
            error.statusCode = 404;
            throw error
        }
        user.status = newStatus
        await user.save()

     res.status(200).json({message: 'User updated'})
    } catch(err) {
        if (!err.statusCode){
            err.statusCode = 500
         }
        next(err)
        }; 
}