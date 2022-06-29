const userController = require("./users.conroller");
const controller = new userController();
const express = require('express');

const router = express.Router();
// router.get('/', controller.getUsers);
router.post('/', controller.expenseSharing);


module.exports = router;
