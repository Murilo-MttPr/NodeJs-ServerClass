const jwt = require('jsonwebtoken')

module.exports = (req, res, next) =>{
    const authHeader = req.get('Authorization');
    if (!authHeader) {
        req.isAuth = false;
        return next()  // Ao invez de throw, usamos next para ao invez de travar o codigo aqui, vamos tratalo no resolvers.js
    }
    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, 'senhaSecreta')
    } catch (err) {
        req.isAuth = false;
        return next();
    }
    if (!decodedToken) {
        req.isAuth = false;
        return next();
    }
    req.userId = decodedToken.userId;
    req.isAuth = true;
    next()
}