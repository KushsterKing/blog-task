const users = require('./users.model');
const configuration = require('./../../../configuration');
// const Realm = require('realm');
const Joi = require("joi");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
// const util = require('util');
// const crypto = require('crypto');
// const sqs = require('../../_helpers/sqs');
// const createLogs = require('../../_helpers/logs');


class userController /*extends Base */{
    constructor() {
        // super();

        this.getUsers = async (req, res) => {

            if(req.user.role === 'ADMIN') {
                const result = await users.find({is_deleted: false, role: 'CONTENT_WRITER'});

                return res.status(200).json({
                    status: 200,
                    success: true,
                    data: result,
                });
            }
            else {
                return res.status(400).json({
                    status: 400,
                    success: false,
                    message: 'Access invalid',
                });
            }

        };

        this.deleteUser = async (req, res) => {
            try {
                if (req.user.role === 'ADMIN') {
                    await users.updateOne({_id: req.params.id}, {
                        $set:{is_deleted: true}
                    });

                    return res.status(200).json({
                        status: 200,
                        success: true,
                        message: 'Deleted successfully',
                    });
                } else {
                    return res.status(400).json({
                        status: 400,
                        success: false,
                        message: 'Access invalid',
                    });
                }
            }catch (e) {
                console.log(e);

                return res.status(400).json({
                    status: 400,
                    success: false,
                    message: 'Access invalid',
                });
            }
        };

        this.register = async (req, res) => {

            let response = {};

            try {

                const schema = Joi.object().keys({
                    first_name: Joi.string().required(),
                    last_name: Joi.string().required(),
                    email: Joi.string().email({
                        minDomainAtoms: 2,
                    }).optional(),
                    role: Joi.string().valid(['CONTENT_WRITER']),
                    password: Joi.string().required()
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

                let regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!#$£%&'()*+,-./:;<=>?@^\\[\]\\"_`{|}~\\])(?=.{8,})/;

                if(!regex.test(request.password)){

                    response = {
                        success: false,
                        status: 400,
                        message: "Password must contain minimum 8 characters with at least a number, a special character, a lower and an upper case letter"
                    };

                    return res.status(400).json(response)
                }

                let result = await users.findOne({ email: req.body.email, is_deleted: false });

                if (result) {

                    response = {
                        status: 400,
                        success: false,
                        message: 'Email already exists',
                    };

                    return res.status(400).json(response);
                }

                let user;

                if (request.password && request.email) {
                    let salt = bcrypt.genSaltSync(10);
                    req.body.password = bcrypt.hashSync(req.body.password, salt);
                }

                let p1 = new Date().getTime();

                user = await users
                    .create(req.body);

                let p2 = new Date().getTime();

                console.log('time taken', p2 - p1);


                const token = jwt.sign(
                    {
                        sub: user._id,
                        role: user.role,
                        last_name: req.body.last_name,
                        first_name: req.body.first_name,
                        email: req.body.email,
                        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
                    },
                    configuration.secret
                );

                response = {
                    status: 200,
                    success: true,
                    data: user,
                    token,
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

        this.login = async (req, res) => {

            let response = {};

            try {

                const schema = Joi.object().keys({
                    email: Joi.string().email({
                        minDomainAtoms: 2,
                    }).required(),
                    password: Joi.string().required(),
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

                const result = await users.findOne({ email: req.body.email, is_deleted: false });

                // let result = await db.connection.db.collection('User').aggregate([
                //     {
                //         $match: {
                //             email: req.body.email
                //         }
                //     },
                //     {
                //         $lookup: {
                //             from: "User-Settings",
                //             localField: "_id",
                //             foreignField: "user_id",
                //             as: "user_settings",
                //         },
                //     },
                //     {
                //         $unwind: {
                //             path: "$user_settings",
                //             preserveNullAndEmptyArrays: true
                //         }
                //     },
                //     {
                //         $lookup: {
                //             from: "Unit-System",
                //             localField: "user_settings.unit_system",
                //             foreignField: "name",
                //             as: "user_settings.unit_system",
                //         },
                //     },
                //     {
                //         $unwind: {
                //             path: "$user_settings.unit_system",
                //             preserveNullAndEmptyArrays: true
                //         }
                //     },
                // ]).toArray();

                if (!result) {

                    response = {
                        status: 400,
                        success: false,
                        message: "User doesn't exist",
                    };

                    return res.status(400).json(response);
                }

                // if (result.is_deleted) {
                //
                //     response = {
                //         status: 400,
                //         success: false,
                //         message: "User deleted",
                //     };
                //
                //     return res.status(400).json(response);
                // }

                let user = result;

                if (!bcrypt.compareSync(req.body.password, user.password)) {
                    response = {
                        status: 400,
                        success: false,
                        message: "Wrong password entered",
                    };

                    return res.status(400).json(response);
                }

                const token = jwt.sign({
                    sub: user._id,
                    role: user.role,
                    last_name: user.last_name,
                    first_name: user.first_name,
                    email: user.email,
                    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
                }, configuration.secret);

                response = {
                    status: 200,
                    success: true,
                    data: user,
                    token
                };

                return res.status(200).json(response)
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

        // this.forgot = async (req, res) => {
        //     let response = {}, message = {
        //         api: `POST /users/forgot-password`,
        //         request: {
        //             body: req.body,
        //             headers: req.headers
        //         }
        //     };
        //     try {
        //
        //         const schema = Joi.object().keys({
        //             email: Joi.string().email({
        //                 minDomainAtoms: 2,
        //             }).required(),
        //         });
        //
        //
        //         let request = req.body;
        //         let resultValidation = Joi.validate(request, schema);
        //
        //         if (resultValidation.error !== null) {
        //
        //             response = {
        //                 status: 400,
        //                 success: false,
        //                 message: 'Field ' + resultValidation.error.details[0].message,
        //             };
        //
        //             message.response = response;
        //
        //             createLogs(message, 'api');
        //
        //             return res.status(400).json(response);
        //         }
        //
        //         let customer_result = await db.connection.db.collection('User').findOne({email: req.body.email});
        //
        //         if(!customer_result) {
        //
        //             response = {
        //                 status: 400,
        //                 success: false,
        //                 message: 'User doesn\'t exist',
        //             };
        //
        //             message.response = response;
        //
        //             createLogs(message, 'api');
        //
        //             return res.status(400).json(response);
        //         }
        //
        //         const randomBytesPromise = util.promisify(crypto.randomBytes);
        //         const buffer = await randomBytesPromise(20);
        //         const token = buffer.toString('hex');
        //         // const date = new Date(Date.now());
        //         // const formattedDate = moment(date, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss');
        //         const dateToSave = new Date(Date.now() + 3600000);
        //         console.log(dateToSave);
        //
        //         let resultUp = await db.connection.db.collection('User').updateOne(
        //             {_id: customer_result._id},
        //             {$set: {resetPasswordToken: token, resetPasswordExpiry: dateToSave}});
        //
        //         let template = await db.connection.db.collection('Template').findOne({name: 'forgot_password'});
        //
        //         const object = {to: request['email'], from: configuration.email_from, subject: template.subject, html: template.template}; //`Please click on the following link to reset your password: ${configuration['apiUrl']}/users/reset-password/${token}?email=${request['email']}`
        //
        //         try {
        //             await sqs.sendMessage(object, {...customer_result, resetPasswordToken: token, resetPasswordExpiry: dateToSave});
        //         } catch (e) {
        //
        //             response = {
        //                 status: 400,
        //                 success: false,
        //                 message: 'Issue in sending email',
        //                 debug: e.stack || ''
        //             };
        //
        //             message.response = response;
        //
        //             createLogs(message, 'api');
        //
        //             return res.status(400).json(response)
        //         }
        //
        //         response = {
        //             status: 200,
        //             success: true,
        //             message: 'An email has been sent to you, please click on it to reset your password.'
        //         };
        //
        //         message.response = response;
        //
        //         createLogs(message, 'api');
        //
        //         return res.status(200).json(response)
        //
        //
        //     } catch (e) {
        //         response = {
        //             status: 400,
        //             success: false,
        //             message: e.message || e.response.data['errors'][0].message || 'Something went wrong while trying to perform this operation',
        //             debug: e.stack || ''
        //         };
        //
        //         message.response = response;
        //
        //         createLogs(message, 'api');
        //
        //         return res.status(400).json(response)
        //     }
        // };
        //
        // this.resetGet = async (req, res) => {
        //
        //     try {
        //         if (!req.params || !req.params.token || !req.query || !req.query.email) {
        //
        //             return res.status(301).redirect(`${configuration.websiteUrl}/auth/reset-password/ERROR?msg=${`Input fields missing`}`);
        //
        //         }
        //
        //         let customer_result = await db.connection.db.collection('User').findOne({email: req.query.email});
        //
        //         if(!customer_result) {
        //
        //             return res.status(301).redirect(`${configuration.websiteUrl}/auth/reset-password/ERROR?msg=${`User does'nt exist`}`);
        //
        //         }
        //
        //         if (customer_result.resetPasswordToken !== req.params.token) {
        //             return res.status(301).redirect(`${configuration.websiteUrl}/auth/reset-password/ERROR?msg=${`Invalid token`}`);
        //
        //         }
        //
        //         if (customer_result.resetPasswordExpiry < new Date()) {
        //             return res.status(301).redirect(`${configuration.websiteUrl}/auth/reset-password/ERROR?msg=${`Token expired`}`);
        //
        //         }
        //
        //         return res.status(301).redirect(`${configuration.websiteUrl}/auth/reset-password/${req.params.token}?email=${req.query.email}`);
        //
        //     } catch (err) {
        //         return res.status(301).redirect(`${configuration.websiteUrl}/auth/reset-password/ERROR?msg=${`Something has gone wrong while trying to reset password`}`);
        //
        //     }
        //
        // };
        //
        // this.resetPost = async (req, res) => {
        //     let response = {}, message = {
        //         api: `POST /users/reset-password/:token(${req.params.token})`,
        //         request: {
        //             body: req.body,
        //             headers: req.headers
        //         }
        //     };
        //
        //     try {
        //
        //         const schema = Joi.object().keys({
        //             newPassword: Joi.required(),
        //             confirmPassword: Joi.required()
        //         });
        //
        //
        //         let request = req.body;
        //         let resultValidation = Joi.validate(request, schema);
        //         if (resultValidation.error !== null) {
        //
        //             response = {
        //                 status: 400,
        //                 success: false,
        //                 message: 'Field ' + resultValidation.error.details[0].message,
        //             };
        //
        //             message.response = response;
        //
        //             createLogs(message, 'api');
        //
        //             return res.status(400).json(response);
        //         }
        //
        //         let regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!#$£%&'()*+,-./:;<=>?@^\\[\]\\"_`{|}~\\])(?=.{8,})/;
        //
        //         if(!regex.test(request.newPassword)){
        //
        //             response = {
        //                 success: false,
        //                 status: 400,
        //                 message: "Password must contain minimum 8 characters with at least a number, a special character, a lower and an upper case letter"
        //             };
        //
        //             message.response = response;
        //
        //             createLogs(message, 'api');
        //
        //             return res.status(400).json(response)
        //         }
        //
        //
        //         if (
        //             !req.params ||
        //             !req.params.token ||
        //             !req.query ||
        //             !req.query.email ||
        //             !req.body.newPassword ||
        //             !req.body.confirmPassword
        //         ) {
        //             response = {
        //                 success: false,
        //                 status: 400,
        //                 message: 'Input fields missing'
        //             };
        //
        //             message.response = response;
        //
        //             createLogs(message, 'api');
        //
        //             return res.status(400).json(response)
        //         }
        //
        //         let customer_result = await db.connection.db.collection('User').findOne({email: req.query.email});
        //
        //         if(!customer_result) {
        //             response = {
        //                 status: 400,
        //                 success: false,
        //                 message: 'User doesn\'t exist',
        //             };
        //
        //             message.response = response;
        //
        //             createLogs(message, 'api');
        //
        //             return res.status(400).json(response);
        //         }
        //
        //
        //         if (req.body.newPassword !== req.body.confirmPassword) {
        //
        //             response = {
        //                 status: 400,
        //                 success: false,
        //                 message: 'The passwords must match each other.',
        //             };
        //
        //             message.response = response;
        //
        //             createLogs(message, 'api');
        //
        //             return res.status(400).json(response);
        //         }
        //
        //         console.log(customer_result.resetPasswordExpiry, new Date(customer_result.resetPasswordExpiry));
        //
        //         let salt = bcrypt.genSaltSync(Number(configuration.adminPasswordSalt));
        //         let hash = bcrypt.hashSync(req.body.newPassword, salt);
        //
        //         const date = new Date();
        //         console.log(date);
        //         // const formattedDate = moment.utc(date, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss');
        //
        //         if (customer_result.resetPasswordExpiry < date) {
        //
        //             response = {
        //                 status: 400,
        //                 success: false,
        //                 message: 'Either the token has expired or you have already changed the password using this token.',
        //             };
        //
        //             message.response = response;
        //
        //             createLogs(message, 'api');
        //
        //             return res.status(400).json(response);
        //         }
        //
        //         await db.connection.db.collection('User').updateOne(
        //             {_id: customer_result._id},
        //             {$set: {password: hash, resetPasswordExpiry: date}});
        //
        //         try{
        //             let template = await db.connection.db.collection('Template').findOne({name: 'reset_password'});
        //             let object = {to: customer_result['email'], from: configuration.email_from, subject: template.subject, html: template.template };
        //             sqs.sendMessage(object, customer_result)
        //         }catch (e) {
        //             console.log(e);
        //         }
        //
        //         response = {
        //             status: 200,
        //             success: true,
        //             message: 'Your password has been changed successfully.',
        //         };
        //
        //         message.response = response;
        //
        //         createLogs(message, 'api');
        //
        //         return res.status(200).json(response);
        //
        //
        //     } catch (e) {
        //
        //         response = {
        //             status: 400,
        //             success: false,
        //             message: e.message || e.response.data['errors'][0].message || 'Something went wrong while trying to perform this operation',
        //             debug: e.stack || ''
        //         };
        //
        //         message.response = response;
        //
        //         createLogs(message, 'api');
        //
        //         return res.status(400).json(response);
        //     }
        //
        // };

        this.changePassword = async (req, res) => {
            let response = {};

            try {

                let customer_result = await users.findOne({_id: req.user.sub});

                if (!customer_result) {

                    response = {
                        status: 400,
                        success: false,
                        message: 'User doesn\'t exist',
                    };

                    return res.status(400).json(response);
                }

                const schema = Joi.object().keys({
                    password: Joi.required(),
                    newPassword: Joi.required(),
                    confirmPassword: Joi.required()
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

                let regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!#$£%&'()*+,-./:;<=>?@^\\[\]\\"_`{|}~\\])(?=.{8,})/;

                if (!regex.test(request.newPassword)) {
                    response = {
                        success: false,
                        status: 400,
                        message: "Password must contain minimum 8 characters with at least a number, a special character, a lower and an upper case letter"
                    };

                    return res.status(400).json(response)
                }

                const isPasswordCorrect = bcrypt.compareSync(req.body.password, customer_result.password);

                if (!isPasswordCorrect) {
                    response = {
                        success: false,
                        status: 400,
                        message: "Your current password is wrong"
                    };

                    return res.status(400).json(response)
                }

                if (req.body.newPassword !== req.body.confirmPassword) {
                    response = {
                        success: false,
                        status: 400,
                        message: "New password and confirm password must be the same"
                    };

                    return res.status(400).json(response)
                }

                if (req.body.password === req.body.newPassword) {
                    response = {
                        success: false,
                        status: 400,
                        message: "New password and previous password can not be the same"
                    };

                    return res.status(400).json(response)
                }

                let salt = bcrypt.genSaltSync(Number(configuration.adminPasswordSalt)); //keep in env
                let hash = bcrypt.hashSync(req.body.newPassword, salt);

                await users.updateOne(
                    {_id: customer_result._id},
                    {$set: {password: hash}});

                // try{
                //     let template = await db.connection.db.collection('Template').findOne({name: 'reset_password'});
                //     let object = {to: customer_result['email'], from: configuration.email_from, subject: template.subject, html: template.template };
                //     sqs.sendMessage(object, customer_result)
                // }catch (e) {
                //     console.log(e);
                // }

                response = {
                    status: 200,
                    success: true,
                    message: 'Your password has been changed successfully.',
                };

                return res.status(200).json(response);

            }catch (e) {

                response = {
                    success: false,
                    status: 400,
                    message: e.message || e.response.data['errors'][0].message || 'Something went wrong while trying to perform this operation',
                    debug: e.stack || ''
                };

                return res.status(400).json(response)
            }
        };
    }
}


module.exports = userController;
