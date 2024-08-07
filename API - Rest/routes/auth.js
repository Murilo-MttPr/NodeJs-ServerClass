const express = require('express');
const {body} = require('express-validator')

const User = require('../models/user');
const isAuth = require('../middleware/is-auth')
const authController = require('../controllers/auth')
const router = express.Router();


//Todo o esquema da validação colocado na rota (Fornecido pelo pacote express-validator)
router.put('/signup', [
    body('email')
        .isEmail()
        .withMessage('Digite um email valido.')
        .custom((value, {req} ) => {
            return User.findOne({email: value}).then(userDoc => {
                if (userDoc) {
                    return Promise.reject('Email ja existe.');
                }
            })
        })
        .normalizeEmail(),
        body('password').trim().isLength({min: 3}),
        body('name').trim().notEmpty()
], authController.signup );

router.post('/login', authController.login);

router.get('/status', isAuth, authController.getUserStatus)

router.patch('/status', isAuth, [
    body('status').trim()
] ,authController.updateUserStatus )

module.exports = router;