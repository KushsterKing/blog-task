const blogsController = require("./blogs.conroller");
const controller = new blogsController();
const express = require('express');

const router = express.Router();
router.post('/', controller.addBlog);
router.get('/', controller.getBlogs);
router.put('/:blog_id', controller.updateBlog);
router.put('/approve/:blog_id', controller.approveBlog);
router.delete('/:blog_id', controller.deleteBlog);



module.exports = router;