const Joi = require("joi");
const blogs = require('./blogs.model');

class blogsController /*extends Base */ {
    constructor() {
        this.getBlogs = async (req,res) =>{
            let response = {};
            try {
                let result = [];
                if(req.user.role === 'ADMIN')
                    result = await blogs.find({is_deleted: false});
                else
                    result = await blogs.find({is_deleted: false, user_id: req.user.sub, approved: true});

                response = {
                    status: 200,
                    success: true,
                    data: result
                };

                return res.status(200).json(response);

            } catch (e) {

                response = {
                    status: 400,
                    success: false,
                    message: e.message || e.response.data['errors'][0].message || 'Something went wrong while trying to perform this operation',
                    debug: e.stack || ''
                };

                return res.status(400).json(response);
            }
        };

        this.addBlog = async (req, res) => {
            let response = {};
            try {

                if(req.user.role !== 'CONTENT_WRITER'){
                    response = {
                        status: 400,
                        success: false,
                        message: 'You\'re not allowed to add blogs',
                    };

                    return res.status(400).json(response);
                }

                const schema = Joi.object().keys({
                    title: Joi.string().required(),
                    content: Joi.string().required(),
                });

                let request = req.body;
                let resultValidation = Joi.validate(request, schema);
                if (resultValidation.error !== null) {

                    response = {
                        status: 400,
                        success: false,
                        message: 'Field ' + resultValidation.error.details[0].message,
                    };

                    return res.status(400).json(response);
                }

                let blog = await blogs
                    .create({
                        ...req.body,
                        user_id: req.user.sub
                    });

                return res.status(200).json({
                    status: 200,
                    success: true,
                    data: blog
                });
                 
            } catch (e) {
                console.log(e);

                response = {
                    status: 400,
                    success: false,
                    message: e.message || e.response.data['errors'][0].message || 'Something went wrong while trying to perform this operation',
                    debug: e.stack || ''
                };

                return res.status(400).json(response);
            }
        };

        this.updateBlog = async (req,res) =>{
            let response = {};
            try {
                if(req.user.role !== 'CONTENT_WRITER'){
                    response = {
                        status: 400,
                        success: false,
                        message: 'You\'re not allowed to update blogs',
                    };

                    return res.status(400).json(response);
                }

                const schema = Joi.object().keys({
                    title: Joi.string().required(),
                    content: Joi.string().required(),
                });

                let request = req.body;

                let resultValidation = Joi.validate(request, schema);
                if (resultValidation.error !== null) {
                    response = {
                        status: 400,
                        success: false,
                        message: 'Field ' + resultValidation.error.details[0].message,
                    };

                    return res.status(400).json(response);
                }
                
                let blog = await blogs.updateOne({user_id: req.user.sub, _id: req.params.blog_id}, {
                    $set: req.body
                });

                response = {
                    status: 200,
                    success: true,
                    data: blog['ops'][0]
                };

                return res.status(200).json(response);

            } catch (e) {

                response = {
                    status: 400,
                    success: false,
                    message: e.message || e.response.data['errors'][0].message || 'Something went wrong while trying to perform this operation',
                    debug: e.stack || ''
                };

                return res.status(400).json(response);
            }
        };

        this.deleteBlog = async (req,res) =>{
            let response = {};

            try {

                let condition = {_id: req.params['blog_id']};
                if(req.user.role === 'CONTENT_WRITER')
                    condition = {...condition, user_id: req.user.sub};

                await blogs.updateOne(condition, {
                    $set: {
                        is_deleted: true
                    }
                });

                response = {
                    status: 200,
                    success: true,
                    message: "Blog deleted successfully"
                };

                return res.status(200).json(response);
            } catch (e) {


                response = {
                    status: 400,
                    success: false,
                    message: e.message || e.response.data['errors'][0].message || 'Something went wrong while trying to perform this operation',
                    debug: e.stack || ''
                };

                return res.status(400).json(response);
            }
        };

        this.approveBlog = async (req,res) =>{
            let response = {};

            try {

                let condition = {_id: req.params['blog_id']};
                if(req.user.role === 'CONTENT_WRITER'){
                    response = {
                        status: 400,
                        success: false,
                        message: "Invalid Access"
                    };

                    return res.status(200).json(response);
                }

                await blogs.updateOne(condition, {
                    $set: {
                        approved: true
                    }
                });

                response = {
                    status: 200,
                    success: true,
                    message: "Blog approved successfully"
                };

                return res.status(200).json(response);
            } catch (e) {


                response = {
                    status: 400,
                    success: false,
                    message: e.message || e.response.data['errors'][0].message || 'Something went wrong while trying to perform this operation',
                    debug: e.stack || ''
                };

                return res.status(400).json(response);
            }
        }
    }
}


module.exports = blogsController;
