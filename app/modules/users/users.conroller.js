const users = require('./users.model');
const db = require('./../../_helpers/db');
const configuration = require('./../../../configuration');
// const Realm = require('realm');
const Joi = require("joi");
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const {shopify_api_key, shopify_password, shopify_url, shopify_version, shopify_storefront_api_access_token} = require('./../../../configuration');
const {GraphQLClient, gql} = require('graphql-request');
const generatePassword = require('./../../_helpers/password-generator-helper');
const util = require('util');
const crypto = require('crypto');
const moment = require('moment');
const sqs = require('../../_helpers/sqs');
const createLogs = require('../../_helpers/logs');


// const REALM_APP_ID = configuration.realmAppId;
// const appConfig = {
//     id: REALM_APP_ID,
//     timeout: 10000,
// };
//
// const app = new Realm.App(appConfig);


class userController /*extends Base */{
    constructor() {
        // super();

        this.getUsers = async (req, res) => {
            // const users = await users.findOne();

            const result = await db.connection.db.collection('User').find().toArray();

            return res.status(200).json({
                status: 200,
                success: true,
                data: result,
            });
        };


        this.register = async (req, res) => {

            let response = {}, message = {
                api: `POST /users/register`,
                request: {
                    body: req.body,
                    headers: req.headers
                }
            };

            const session = await mongoose.startSession(), object_id = mongoose.Types.ObjectId().toString(); let new_user = false, data_to_send = {};
            try {

                const schema = Joi.object().keys({
                    first_name: Joi.string().optional(),
                    last_name: Joi.string().optional(),
                    email: Joi.string().email({
                        minDomainAtoms: 2,
                    }).optional(),
                    password: Joi.string().optional(),
                    provider_name: Joi.string().required(),
                    provider_id: Joi.string().optional(),
                    picture: Joi.string().optional(),

                });

                let request = req.body;
                let resultValidation = Joi.validate(request, schema);

                if (resultValidation.error !== null) {

                    response = {
                        status: 400,
                        success: false,
                        message: 'Field ' + resultValidation.error.details[0].message,
                    };

                    message.response = response;

                    createLogs(message, 'api');

                    return res.status(400).json(response);
                }

                if(!request.email && !request.provider_id){

                    response = {
                        status: 400,
                        success: false,
                        message: 'Either email or provider id required',
                    };

                    message.response = response;

                    createLogs(message, 'api');

                    return res.status(400).json(response);
                }

                if(request.email && request.password){
                    // let regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
                    let regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!#$£%&'()*+,-./:;<=>?@^\\[\]\\"_`{|}~\\])(?=.{8,})/;

                    if(!regex.test(request.password)){

                        response = {
                            success: false,
                            status: 400,
                            message: "Password must contain minimum 8 characters with at least a number, a special character, a lower and an upper case letter"
                        };

                        message.response = response;

                        createLogs(message, 'api');

                        return res.status(400).json(response)
                    }

                    const schema = Joi.object().keys({
                        first_name: Joi.string().required(),
                        last_name: Joi.string().required(),
                        email: Joi.string().email({
                            minDomainAtoms: 2,
                        }).required(),
                        password: Joi.string().required(),
                        provider_name: Joi.string().required(),
                        picture: Joi.string().optional(),

                    });

                    let resultValidation = Joi.validate(request, schema);

                    if (resultValidation.error !== null) {

                        response = {
                            status: 400,
                            success: false,
                            message: 'Field ' + resultValidation.error.details[0].message,
                        };

                        message.response = response;

                        createLogs(message, 'api');

                        return res.status(400).json(response);
                    }
                }
                
                let result = await db.connection.db.collection('User').findOne({ email: req.body.email });
                req.body.provider = {
                    "manual":false,
                    "facebook":false,
                    "google":false,
                    "twitter":false,
                    "apple":false,
                };
                if(!req.body.provider_name || (req.body.provider_name !='manual' && req.body.provider_name !='facebook' && req.body.provider_name !='google' && req.body.provider_name !='twitter' && req.body.provider_name !='apple')){

                    response = {
                        status: 400,
                        success: false,
                        message: 'Provider name missing.',
                    };

                    message.response = response;

                    createLogs(message, 'api');

                    return res.status(400).json(response);
                }
                let provider_name = (req.body.provider_name).toLowerCase();

                req.body.provider_name = (req.body.provider_name).toLowerCase()+'_id';
                req.body.provider.manual = req.body.provider_name === 'manual_id';
                req.body.twitter_id = '';
                req.body.facebook_id = '';
                req.body.google_id= '';
                req.body.apple_id = '';

                req.body.provider[provider_name] = true;
                
                if(req.body.provider_name !== 'manual_id'){
                    if(!result){
                        result = await db.connection.db.collection('User').findOne({ [req.body.provider_name]: req.body.provider_id });
                    }
                    
                    if (result) {


                        await session.withTransaction(async () => {
                        await db.connection.db
                            .collection('User').updateOne({_id: result['_id']}, {
                                $set: {
                                    [req.body.provider_name]: req.body.provider_id,
                                    provider: req.body.provider
                                }
                            },{ upsert: true, session });
                        });

                        let resultUpdate = await db.connection.db.collection('User').findOne({_id: result['_id'] });
                        const token = jwt.sign(
                            {
                                sub: resultUpdate['_id'],
                                partition: resultUpdate['partition'],
                                last_name: resultUpdate['last_name'],
                                first_name: resultUpdate['first_name'],
                                email: resultUpdate['email'],
                                provider_id: req.body.provider_id,
                                exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12,
                            },
                            configuration.secret
                        );

                        response = {
                            status: 200,
                            success: true,
                            data: resultUpdate,
                            token,
                        };

                        message.response = response;

                        createLogs(message, 'api');

                        return res.status(200).json(response);
                        
                    }
                }

                if (result) {

                    response = {
                        status: 400,
                        success: false,
                        message: 'Email already exists',
                    };

                    message.response = response;

                    createLogs(message, 'api');

                    return res.status(400).json(response);
                }
                // const register_result = await app.emailPasswordAuth.registerUser(
                //   req.body.email,
                //   req.body.password
                // );

                // console.log(register_result);

                let user;

                // const credentials = Realm.Credentials.emailPassword(
                //     req.body.email,
                //     req.body.password
                // );
                //
                // user = await app.logIn(credentials);
                data_to_send.password = request.password;
                if (request.password && request.email) {
                    let salt = bcrypt.genSaltSync(10);
                    req.body.password = bcrypt.hashSync(req.body.password, salt);
                }
                // let password = req.body.password;
                // delete req.body.password;

                let p1 = new Date().getTime();

                req.body.picture = req.body.picture? req.body.picture: "";
                req.body.first_name = req.body.first_name? req.body.first_name: "";
                req.body.last_name = req.body.last_name? req.body.last_name: "";
                req.body.step_status = 0.0;
                
                await session.withTransaction(async () => {

                    user = await db.connection.db
                        .collection('User')
                        .insertOne({
                            ...req.body,
                            step_status: 1,
                            canReadPartitions: [`user=${object_id}`],
                            canWritePartitions: [`user=${object_id}`],
                            _partition: `user=${object_id}`,
                            _id: object_id
                        }, { session: session });
                });

                // const credentials = Realm.Credentials.function({
                //     password: req.body.password,
                //     email: req.body.email,
                //     first_name: req.body.first_name,
                //     last_name: req.body.last_name,
                // });
                // // const credentials = Realm.Credentials.anonymous();
                // user = await app.logIn(credentials);
                // user.functions.addBaby();
                let p2 = new Date().getTime();

                console.log('time taken', p2 - p1);

                // console.log(
                //     user.id,
                //     // user.identities[0].id,
                //     user.customData,
                //     user._partition,
                //     user.first_name,
                //     user.last_name,
                //     user.email,
                //     user.picture
                // );


                // delete req.body.password;

                // const user_result = await db.connection.db
                //   .collection('User')
                //   .insertOne({
                //     ...req.body,
                //     _id: user.id,
                //     _partition: `user=${user.id}`,
                //   });

                // await db.connection.db.collection('User').updateOne({email: req.body.email}, {$set: {_partition: `user=${user_result.id}`}});
                // user_result._partition = `user=${user_result.id}`;
                //
                // user_result.save();

                const token = jwt.sign(
                    {
                        sub: object_id,
                        partition: `user=${object_id}`,
                        last_name: req.body.last_name,
                        first_name: req.body.first_name,
                        email: req.body.email,
                        providerId: req.body.providerId,
                        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
                    },
                    configuration.secret
                );

                response = {
                    status: 200,
                    success: true,
                    data: user['ops'][0],
                    token,
                };

                message.response = response;

                createLogs(message, 'api');

                new_user = true; data_to_send = {...req.body, password: data_to_send.password};

                return res.status(200).json(response);
            } catch (e) {
                try {
                    await session.abortTransaction();
                } catch (e) {

                }

                response = {
                    status: 400,
                    success: false,
                    message: e.message || e.response.data['errors'][0].message || 'Something went wrong while trying to perform this operation',
                    debug: e.stack || ''
                };

                message.response = response;

                createLogs(message, 'api');

                return res.status(400).json(response);
            } finally {

                let message = {
                    shopify_request: {}
                };
                try {

                    if(new_user) {

                        try {
                            if(req.body.email) {
                                let template = await db.connection.db.collection('Template').findOne({name: (req.body.provider_name === 'manual_id' ? 'register_manual' : 'register_social')});
                                const object = {
                                    to: req.body.email,
                                    from: configuration.email_from,
                                    subject: template.subject,
                                    html: template.template
                                };
                                sqs.sendMessage(object, data_to_send)
                            }
                        } catch (e) {
                            console.log(e);
                        }

                        message.shopify_request.url = `https://${shopify_api_key}:${shopify_password}@${shopify_url}/api/${shopify_version}/graphql.json`;

                        const graphQLClient = new GraphQLClient(`https://${shopify_api_key}:${shopify_password}@${shopify_url}/api/${shopify_version}/graphql.json`, {
                            headers: {
                                'Content-Type': 'application/json',
                                'X-Shopify-Storefront-Access-Token': shopify_storefront_api_access_token
                            }
                        });

                        let password = generatePassword.generatePassword(),
                            password_to_send = (new Buffer(password)).toString('base64');

                        let query = gql`
                        mutation customerCreate {
                          customerCreate(input: {
                                email: "${req.body.email}",
                                password: "${password}"
                            }) {
                            customer {
                              id,
                              
                            }
                            customerUserErrors {
                              code
                              field
                              message
                            }
                          }
                        }
                        `;

                        query = gql`${query}`;

                        message.shopify_request.query = query;

                        const response = await graphQLClient.request(query);

                        message.shopify_response = response;


                        if (response['customerCreate'] && Array.isArray(response['customerCreate']['customerUserErrors']) && response['customerCreate']['customerUserErrors'].length) {
                            if (response['customerCreate']['customerUserErrors'][0].code === 'TAKEN') {

                                message.shopify_request.url = `https://${shopify_api_key}:${shopify_password}@${shopify_url}/admin/customers/search.json?query=email:"${req.body.email}"&fields=id,email`;

                                const get_response = await axios.get(
                                    `https://${shopify_api_key}:${shopify_password}@${shopify_url}/admin/customers/search.json?query=email:"${req.body.email}"&fields=id,email`
                                );

                                if (Array.isArray(get_response.data.customers) && get_response.data.customers.length) {

                                    message.shopify_request.url = `https://${shopify_api_key}:${shopify_password}@${shopify_url}/admin/customers/${get_response.data.customers[0].id}.json`;

                                    message.shopify_request.body = {
                                        customer: {
                                            "id": get_response.data.customers[0].id,
                                            "password": password,
                                            "password_confirmation": password
                                        }
                                    };

                                    const put_response = await axios.put(
                                        `https://${shopify_api_key}:${shopify_password}@${shopify_url}/admin/customers/${get_response.data.customers[0].id}.json`,
                                        {
                                            customer: {
                                                "id": get_response.data.customers[0].id,
                                                "password": password,
                                                "password_confirmation": password
                                            }
                                        }
                                    );

                                    await db.connection.db
                                        .collection('User').updateOne({_id: object_id,}, {
                                            $set: {
                                                shopify_id: (new Buffer(`gid://shopify/Customer/${put_response.data.customer.id.toString()}`)).toString('base64'),
                                                shopify_password: password_to_send,
                                            }
                                        }, {session});
                                }


                            }
                        } else {
                            await db.connection.db
                                .collection('User').updateOne({_id: object_id,}, {
                                    $set: {
                                        shopify_id: response['customerCreate']['customer'].id.toString(),
                                        shopify_password: password_to_send,
                                    }
                                }, {session});
                        }
                    }

                    session.endSession();
                } catch (e) {

                    console.log(e);

                    message = {
                        operation: 'create shopify customer while registering',
                        error: e.message || e.response.data['errors'][0].message || 'Something went wrong while trying to perform this operation',
                        debug: e.stack || ''
                    };

                    createLogs(message, 'shopify')

                    // session.abortTransaction();
                }


                // axios.post(configuration.shopify_url + 'customers', {email: req.body.email}, {
                //     headers: {
                //         "client-id": configuration.client_id,
                //         "secret-key": configuration.secret_key
                //     }
                // }).then(async response => {
                //     await db.connection.db
                //         .collection('User').updateOne({_id: object_id,}, {
                //         $set: {
                //             shopify_id: response.data.data.id.toString(),
                //             shopify_password: response.data.data.password,
                //         }
                //     }, {session});
                //
                // }).catch( error => {
                //     // session.abortTransaction();
                //     console.log(error);
                // }).finally(() => {
                //     session.endSession();
                // });

            }

        };

        this.login = async (req, res) => {

            console.log(req.body);
            let response = {}, message = {
                api: `POST /users/login`,
                request: {
                    body: req.body,
                    headers: req.headers
                }
            };

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

                    message.response = response;

                    createLogs(message, 'api');

                    return res.status(400).json(response);
                }

                // const result = await db.connection.db
                //     .collection('User')
                //     .findOne({ email: req.body.email });

                let result = await db.connection.db.collection('User').aggregate([
                    {
                        $match: {
                            email: req.body.email
                        }
                    },
                    {
                        $lookup: {
                            from: "User-Settings",
                            localField: "_id",
                            foreignField: "user_id",
                            as: "user_settings",
                        },
                    },
                    {
                        $unwind: {
                            path: "$user_settings",
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $lookup: {
                            from: "Unit-System",
                            localField: "user_settings.unit_system",
                            foreignField: "name",
                            as: "user_settings.unit_system",
                        },
                    },
                    {
                        $unwind: {
                            path: "$user_settings.unit_system",
                            preserveNullAndEmptyArrays: true
                        }
                    },
                ]).toArray();

                if (!result.length) {

                    response = {
                        status: 400,
                        success: false,
                        message: "User doesn't exist",
                    };

                    message.response = response;

                    createLogs(message, 'api');

                    return res.status(400).json(response);
                }

                let user = result[0];

                // try {

                //     const credentials = Realm.Credentials.emailPassword(
                //         req.body.email,
                //         req.body.password
                //     );

                //     user = await app.logIn(credentials);
                // } catch (e) {
                //     return res.status(400).json({
                //         status: 400,
                //         success: false,
                //         message: 'Error in logging in with realm'
                //     })
                // }

                if(!user.password && !user.provider.manual){
                    response = {
                        status: 400,
                        success: false,
                        message: 'Please login with ' + Object.keys(request.provider).find(elm => request.provider[elm] === true),
                    };

                    message.response = response;

                    createLogs(message, 'api');

                    return res.status(400).json(response);
                }

                if (!bcrypt.compareSync(req.body.password, user.password)) {
                    response = {
                        status: 400,
                        success: false,
                        message: "Wrong password entered",
                    };

                    message.response = response;

                    createLogs(message, 'api');

                    return res.status(400).json(response);
                }

                const token = jwt.sign({
                    sub: user._id,
                    partition: user._partition,
                    last_name: user.last_name,
                    first_name: user.first_name,
                    shopify_id: user.shopify_id,
                    email: user.email,
                    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
                }, configuration.secret);

                response = {
                    status: 200,
                    success: true,
                    data: user,
                    token
                };

                message.response = response;

                createLogs(message, 'api');

                return res.status(200).json(response)
            } catch (e) {

                response = {
                    status: 400,
                    success: false,
                    message: e.message || e.response.data['errors'][0].message || 'Something went wrong while trying to perform this operation',
                    debug: e.stack || ''
                };

                message.response = response;

                createLogs(message, 'api');

                return res.status(400).json(response);
            }


        };

        this.forgot = async (req, res) => {
            let response = {}, message = {
                api: `POST /users/forgot-password`,
                request: {
                    body: req.body,
                    headers: req.headers
                }
            };
            try {

                const schema = Joi.object().keys({
                    email: Joi.string().email({
                        minDomainAtoms: 2,
                    }).required(),
                });


                let request = req.body;
                let resultValidation = Joi.validate(request, schema);

                if (resultValidation.error !== null) {

                    response = {
                        status: 400,
                        success: false,
                        message: 'Field ' + resultValidation.error.details[0].message,
                    };

                    message.response = response;

                    createLogs(message, 'api');

                    return res.status(400).json(response);
                }

                let customer_result = await db.connection.db.collection('User').findOne({email: req.body.email});

                if(!customer_result) {

                    response = {
                        status: 400,
                        success: false,
                        message: 'User doesn\'t exist',
                    };

                    message.response = response;

                    createLogs(message, 'api');

                    return res.status(400).json(response);
                }

                const randomBytesPromise = util.promisify(crypto.randomBytes);
                const buffer = await randomBytesPromise(20);
                const token = buffer.toString('hex');
                // const date = new Date(Date.now());
                // const formattedDate = moment(date, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss');
                const dateToSave = new Date(Date.now() + 3600000);
                console.log(dateToSave);

                let resultUp = await db.connection.db.collection('User').updateOne(
                    {_id: customer_result._id},
                    {$set: {resetPasswordToken: token, resetPasswordExpiry: dateToSave}});

                let template = await db.connection.db.collection('Template').findOne({name: 'forgot_password'});

                const object = {to: request['email'], from: configuration.email_from, subject: template.subject, html: template.template}; //`Please click on the following link to reset your password: ${configuration['apiUrl']}/users/reset-password/${token}?email=${request['email']}`

                try {
                    await sqs.sendMessage(object, {...customer_result, resetPasswordToken: token, resetPasswordExpiry: dateToSave});
                } catch (e) {

                    response = {
                        status: 400,
                        success: false,
                        message: 'Issue in sending email',
                        debug: e.stack || ''
                    };

                    message.response = response;

                    createLogs(message, 'api');

                    return res.status(400).json(response)
                }

                response = {
                    status: 200,
                    success: true,
                    message: 'An email has been sent to you, please click on it to reset your password.'
                };

                message.response = response;

                createLogs(message, 'api');

                return res.status(200).json(response)


            } catch (e) {
                response = {
                    status: 400,
                    success: false,
                    message: e.message || e.response.data['errors'][0].message || 'Something went wrong while trying to perform this operation',
                    debug: e.stack || ''
                };

                message.response = response;

                createLogs(message, 'api');

                return res.status(400).json(response)
            }
        };

        this.resetGet = async (req, res) => {

            try {
                if (!req.params || !req.params.token || !req.query || !req.query.email) {

                    return res.status(301).redirect(`${configuration.websiteUrl}/auth/reset-password/ERROR?msg=${`Input fields missing`}`);

                }

                let customer_result = await db.connection.db.collection('User').findOne({email: req.query.email});

                if(!customer_result) {

                    return res.status(301).redirect(`${configuration.websiteUrl}/auth/reset-password/ERROR?msg=${`User does'nt exist`}`);

                }

                if (customer_result.resetPasswordToken !== req.params.token) {
                    return res.status(301).redirect(`${configuration.websiteUrl}/auth/reset-password/ERROR?msg=${`Invalid token`}`);

                }

                if (customer_result.resetPasswordExpiry < new Date()) {
                    return res.status(301).redirect(`${configuration.websiteUrl}/auth/reset-password/ERROR?msg=${`Token expired`}`);

                }

                return res.status(301).redirect(`${configuration.websiteUrl}/auth/reset-password/${req.params.token}?email=${req.query.email}`);

            } catch (err) {
                return res.status(301).redirect(`${configuration.websiteUrl}/auth/reset-password/ERROR?msg=${`Something has gone wrong while trying to reset password`}`);

            }

        };

        this.resetPost = async (req, res) => {
            let response = {}, message = {
                api: `POST /users/reset-password/:token(${req.params.token})`,
                request: {
                    body: req.body,
                    headers: req.headers
                }
            };

            try {

                const schema = Joi.object().keys({
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

                    message.response = response;

                    createLogs(message, 'api');

                    return res.status(400).json(response);
                }

                let regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!#$£%&'()*+,-./:;<=>?@^\\[\]\\"_`{|}~\\])(?=.{8,})/;

                if(!regex.test(request.newPassword)){

                    response = {
                        success: false,
                        status: 400,
                        message: "Password must contain minimum 8 characters with at least a number, a special character, a lower and an upper case letter"
                    };

                    message.response = response;

                    createLogs(message, 'api');

                    return res.status(400).json(response)
                }


                if (
                    !req.params ||
                    !req.params.token ||
                    !req.query ||
                    !req.query.email ||
                    !req.body.newPassword ||
                    !req.body.confirmPassword
                ) {
                    response = {
                        success: false,
                        status: 400,
                        message: 'Input fields missing'
                    };

                    message.response = response;

                    createLogs(message, 'api');

                    return res.status(400).json(response)
                }

                let customer_result = await db.connection.db.collection('User').findOne({email: req.query.email});

                if(!customer_result) {
                    response = {
                        status: 400,
                        success: false,
                        message: 'User doesn\'t exist',
                    };

                    message.response = response;

                    createLogs(message, 'api');

                    return res.status(400).json(response);
                }


                if (req.body.newPassword !== req.body.confirmPassword) {

                    response = {
                        status: 400,
                        success: false,
                        message: 'The passwords must match each other.',
                    };

                    message.response = response;

                    createLogs(message, 'api');

                    return res.status(400).json(response);
                }

                console.log(customer_result.resetPasswordExpiry, new Date(customer_result.resetPasswordExpiry));

                let salt = bcrypt.genSaltSync(Number(configuration.adminPasswordSalt));
                let hash = bcrypt.hashSync(req.body.newPassword, salt);

                const date = new Date();
                console.log(date);
                // const formattedDate = moment.utc(date, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss');

                if (customer_result.resetPasswordExpiry < date) {

                    response = {
                        status: 400,
                        success: false,
                        message: 'Either the token has expired or you have already changed the password using this token.',
                    };

                    message.response = response;

                    createLogs(message, 'api');

                    return res.status(400).json(response);
                }

                await db.connection.db.collection('User').updateOne(
                    {_id: customer_result._id},
                    {$set: {password: hash, resetPasswordExpiry: date}});

                try{
                    let template = await db.connection.db.collection('Template').findOne({name: 'reset_password'});
                    let object = {to: customer_result['email'], from: configuration.email_from, subject: template.subject, html: template.template };
                    sqs.sendMessage(object, customer_result)
                }catch (e) {
                    console.log(e);
                }

                response = {
                    status: 200,
                    success: true,
                    message: 'Your password has been changed successfully.',
                };

                message.response = response;

                createLogs(message, 'api');

                return res.status(200).json(response);


            } catch (e) {

                response = {
                    status: 400,
                    success: false,
                    message: e.message || e.response.data['errors'][0].message || 'Something went wrong while trying to perform this operation',
                    debug: e.stack || ''
                };

                message.response = response;

                createLogs(message, 'api');

                return res.status(400).json(response);
            }

        };

        this.changePassword = async (req, res) => {
            let response = {}, message = {
                api: `POST /users/change-password`,
                request: {
                    body: req.body,
                    headers: req.headers,
                    user: req.user
                }
            };

            try {

                let customer_result = await db.connection.db.collection('User').findOne({_id: req.user.sub});

                if (!customer_result) {

                    response = {
                        status: 400,
                        success: false,
                        message: 'User doesn\'t exist',
                    };

                    message.response = response;

                    createLogs(message, 'api');

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

                    message.response = response;

                    createLogs(message, 'api');

                    return res.status(400).json(response);
                }

                let regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!#$£%&'()*+,-./:;<=>?@^\\[\]\\"_`{|}~\\])(?=.{8,})/;

                if (!regex.test(request.newPassword)) {
                    response = {
                        success: false,
                        status: 400,
                        message: "Password must contain minimum 8 characters with at least a number, a special character, a lower and an upper case letter"
                    };

                    message.response = response;

                    createLogs(message, 'api');

                    return res.status(400).json(response)
                }

                const isPasswordCorrect = bcrypt.compareSync(req.body.password, customer_result.password);

                if (!isPasswordCorrect) {
                    response = {
                        success: false,
                        status: 400,
                        message: "Your current password is wrong"
                    };

                    message.response = response;

                    createLogs(message, 'api');

                    return res.status(400).json(response)
                }

                if (req.body.newPassword !== req.body.confirmPassword) {
                    response = {
                        success: false,
                        status: 400,
                        message: "New password and confirm password must be the same"
                    };

                    message.response = response;

                    createLogs(message, 'api');

                    return res.status(400).json(response)
                }

                if (req.body.password === req.body.newPassword) {
                    response = {
                        success: false,
                        status: 400,
                        message: "New password and previous password can not be the same"
                    };

                    message.response = response;

                    createLogs(message, 'api');

                    return res.status(400).json(response)
                }

                let salt = bcrypt.genSaltSync(Number(configuration.adminPasswordSalt)); //keep in env
                let hash = bcrypt.hashSync(req.body.newPassword, salt);

                await db.connection.db.collection('User').updateOne(
                    {_id: customer_result._id},
                    {$set: {password: hash}});

                try{
                    let template = await db.connection.db.collection('Template').findOne({name: 'reset_password'});
                    let object = {to: customer_result['email'], from: configuration.email_from, subject: template.subject, html: template.template };
                    sqs.sendMessage(object, customer_result)
                }catch (e) {
                    console.log(e);
                }

                response = {
                    status: 200,
                    success: true,
                    message: 'Your password has been changed successfully.',
                };

                message.response = response;

                createLogs(message, 'api');

                return res.status(200).json(response);

            }catch (e) {

                response = {
                    success: false,
                    status: 400,
                    message: e.message || e.response.data['errors'][0].message || 'Something went wrong while trying to perform this operation',
                    debug: e.stack || ''
                };

                message.response = response;

                createLogs(message, 'api');

                return res.status(400).json(response)
            }
        };

        this.step = async (req, res) => {
            console.log(req.body);
            let response = {}, message = {
                api: `PUT /users/step`,
                request: {
                    body: req.body,
                    headers: req.headers,
                    user: req.user
                }
            };

            try {

                const schema = Joi.object().keys({
                    step: Joi.number().valid(2, 3, 4).required()
                });

                let request = req.body;
                let resultValidation = Joi.validate(request, schema);

                if (resultValidation.error !== null) {

                    response = {
                        status: 400,
                        success: false,
                        message: 'Field ' + resultValidation.error.details[0].message,
                    };

                    message.response = response;

                    createLogs(message, 'api');

                    return res.status(400).json(response);
                }

                await db.connection.db
                    .collection('User')
                    .updateOne({ _id: req.user.sub, step_status: (request.step - 1) }, {$set: {step_status: request.step}});

                response = {
                    success: true,
                    status: 200,
                    message: 'Step changed successfully'
                };

                message.response = response;

                createLogs(message, 'api');

                return res.status(200).json(response)

            } catch (e) {

                response = {
                    success: false,
                    status: 400,
                    message: e.message || e.response.data['errors'][0].message || 'Something went wrong while trying to perform this operation',
                    debug: e.stack || ''
                };

                message.response = response;

                createLogs(message, 'api');

                return res.status(400).json(response);
            }
        };

        this.update = async (req, res) => {
            console.log(req.body);
            let response = {}, message = {
                api: `PUT /users`,
                request: {
                    body: req.body,
                    headers: req.headers,
                    user: req.user
                }
            };

            try {

                const schema = Joi.object().keys({
                    first_name: Joi.string().required(),
                    last_name: Joi.string().required(),
                    email: Joi.string().email({
                        minDomainAtoms: 2,
                    }).required(),
                });

                let request = req.body;
                let resultValidation = Joi.validate(request, schema);

                if (resultValidation.error !== null) {

                    response = {
                        status: 400,
                        success: false,
                        message: 'Field ' + resultValidation.error.details[0].message,
                    };

                    message.response = response;

                    createLogs(message, 'api');

                    return res.status(400).json(response);
                }

                await db.connection.db
                    .collection('User')
                    .updateOne({ _id: req.user.sub }, {$set: req.body});

                if(!req.user.email) {
                    let template = await db.connection.db.collection('Template').findOne({name: 'register_social'});
                    const object = {
                        to: req.body.email,
                        from: configuration.email_from,
                        subject: template.subject,
                        html: template.template
                    };
                    sqs.sendMessage(object, req.body)
                }

                response = {
                    success: true,
                    status: 200,
                    message: 'Information updated successfully'
                };

                message.response = response;

                createLogs(message, 'api');

                return res.status(200).json(response)

            } catch (e) {

                response = {
                    success: false,
                    status: 400,
                    message: e.message || e.response.data['errors'][0].message || 'Something went wrong while trying to perform this operation',
                    debug: e.stack || ''
                };

                message.response = response;

                createLogs(message, 'api');

                return res.status(400).json(response);
            }
        };
    }
}


module.exports = userController;
