const express = require('express');
const { check, body } = require('express-validator');

const authController = require('../controllers/auth');
const User = require('../models/user')

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post(
    '/login',
    [
      body('email')
        .isEmail()
        .withMessage('Please enter a valid email address.')
        .normalizeEmail(),
      body('password', 'Password has to be valid.')
        .isLength({ min: 3 })
        .isAlphanumeric()
        .trim()
    ],
    authController.postLogin
  );

router.post('/signup',
    [
        check('email')
            .isEmail()
            .withMessage('Por Favor, digite um e-mail valido')
            .custom((value, { req }) => {
                return User.findOne({ email: value })
                    .then(userDoc => {
                        if (userDoc) {
                            return Promise.reject('Esse e-mail já existe. Cadestre um novo')
                        }
                    })
            })
            .normalizeEmail(),
        body('password', 'Por Favor,senha de 3 a 8 caracteres entre letras e números ')
            .isLength({ min: 3, max: 8 })
            .isAlphanumeric()
            .trim(),
        body('confirmPassword').trim().custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords are diferents')
            }
            return true;
        })

    ],
    authController.postSignup);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router