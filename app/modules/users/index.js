const userController = require("./users.conroller");
const controller = new userController();
const express = require('express');

const router = express.Router();
// router.get('/', controller.getUsers);
router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/forgot-password', controller.forgot);
router.get('/reset-password/:token', controller.resetGet);
router.post('/reset-password/:token', controller.resetPost);
router.post('/change-password', controller.changePassword);
router.put('/step', controller.step);
router.put('/', controller.update);


module.exports = router;