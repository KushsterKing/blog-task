const Joi = require("joi");
const db = require('../../_helpers/db');
const convertUnits = require('../../_helpers/convertUnits');
const mongoose = require('mongoose');
const createLogs = require('../../_helpers/logs');
const sqs = require('../../_helpers/sqs');
const configuration = require('../../../configuration');

class babyActivityController /*extends Base */ {
    constructor() {
        this.getActivity = async (req,res) =>{
            let response = {}, message = {
                api: `GET /baby_activity/:baby_id(${req.params.baby_id})`,
                request: {
                    headers: req.headers,
                    user: req.user
                }
            };
            try {
                let result = await db.connection.db.collection('Baby-Activity').find({baby_id: req.params['baby_id']}).toArray();
                if (!result) {
                    return res.status(200).json({
                        status: 200,
                        success: true,
                        data: result
                    });
                } else {
                    return res.status(200).json({
                        status: 200,
                        success: true,
                        data: result
                    });
                }
            } catch (e) {

                if(configuration.send_mail) {
                    let object = {
                        subject: `Error ${message.api} ${configuration.environment}`,
                        to: configuration.support_email,// 'anuj@bettertechsolution.com,neeru.g@bettertechsolution.com', //
                        from: configuration.email_from,
                        // html: 'hey'
                        html: `<h3 style=" margin: 5px 0">Error ${message.api}(environment: ${configuration.environment})</h3><br/>
                    <p style="margin: 5px 0">Customer info : ` + ((req && req.user && req.user.sub) ? JSON.stringify(req.user) : 'No info') + `</p>
                    <p style="margin: 5px 0">` + e.stack + `</p>
                    <br>`
                    };

                    try {
                        sqs.sendMessage(object)
                    } catch (e) {
                        console.log(e);
                    }
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
            }
        };

        this.addActivity = async (req, res) => {
            const session = await mongoose.startSession(), object_id = mongoose.Types.ObjectId().toString();
            let response = {}, message = {
                api: `POST /baby_activity`,
                request: {
                    headers: req.headers,
                    body: req.body,
                    user: req.user
                }
            };
            try {
                const schema = Joi.object().keys({
                    baby_id: Joi.string().required(),
                    activity_id: Joi.string().required(),
                    weight: Joi.optional(),
                    quantity: Joi.optional(),
                    // attachments: Joi.optional(),
                    notes: Joi.optional(),
                    reason: Joi.optional(),
                    reaction: Joi.optional(),
                    duration: Joi.optional(),
                    left_duration: Joi.optional(),
                    right_duration: Joi.optional(),
                    mood: Joi.optional(),
                    start_time: Joi.optional(),
                    end_time: Joi.optional(),
                    // custom_field: Joi.optional(),
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

                let baby_record = await db.connection.db.collection('Baby').findOne({
                    _id: request.baby_id,
                });
                if(!baby_record){
                    response = {
                        status: 400,
                        success: false,
                        message: 'Wrong baby ID',
                    };

                    message.response = response;

                    createLogs(message, 'api');

                    return res.status(400).json(response);
                }

                console.log("request.activity_id===========",request.activity_id)
                let activity_record = await db.connection.db.collection('Activity').findOne({
                    _id: mongoose.Types.ObjectId(request.activity_id)
                });

                if(!activity_record){
                    response = {
                        status: 400,
                        success: false,
                        message: 'Wrong activity ID',
                    };

                    message.response = response;

                    createLogs(message, 'api');

                    return res.status(400).json(response);
                }

                let user_record = await db.connection.db.collection('User').findOne({ _id: req.user.sub });
                
                if (!user_record) {
                    response = {
                        status: 400,
                        success: false,
                        message: 'User Not found',
                    };

                    message.response = response;

                    createLogs(message, 'api');

                    return res.status(400).json(response);
                }


                let user_settings_record = await db.connection.db.collection('User-Settings').findOne({ user_id: req.user.sub });
                if (!user_settings_record) {
                    response = {
                        status: 400,
                        success: false,
                        message: 'User Setting Not found',
                    };

                    message.response = response;

                    createLogs(message, 'api');

                    return res.status(400).json(response);
                }

                let { canWriteBabies = [] } = user_record;
                console.log("user_record=========",user_record);
                if(!canWriteBabies.includes(`baby=${request.baby_id}`)){
                    response = {
                        status: 400,
                        success: false,
                        message: 'This user do not have write permission to this baby',
                    };

                    message.response = response;

                    createLogs(message, 'api');

                    return res.status(400).json(response);
                }

                let weight_unit = 'g', volume_unit = 'ml';

                if(user_settings_record){
                    weight_unit = user_settings_record.unit_system === 'imperial'? 'lb': weight_unit;
                    volume_unit = user_settings_record.unit_system === 'imperial'? 'fl-oz': volume_unit;
                }


                if(request.quantity){

                    try{
                        const response = await convertUnits({unitTo: 'ml', unitFrom: volume_unit, value: request.quantity, type: 'volume'});
                        if(response && response.status !== 200){
                            return res.status(response.status).json(response);
                        }
                        request.quantity = response.data;
                    }catch(e){

                        response = {
                            status: 400,
                            success: false,
                            message: 'Something gone wrong while converting units',
                        };

                        message.response = response;

                        createLogs(message, 'api');

                        return res.status(400).json(response);
                    }

                }

                if(request.weight){

                    try{
                        const response = await convertUnits({unitTo: 'g', unitFrom: weight_unit, value: request.weight, type: 'weight'});
                        if(response && response.status !== 200){
                            return res.status(response.status).json(response);
                        }
                        request.weight = response.data;
                    }catch(e){
                        response = {
                            status: 400,
                            success: false,
                            message: 'Something gone wrong while converting units',
                        };

                        message.response = response;

                        createLogs(message, 'api');

                        return res.status(400).json(response);
                    }

                }

                let baby;
                
                baby = await db.connection.db
                    .collection('Baby-Activity')
                    .insertOne({
                        _partition: `baby=${request.baby_id}`,
                        activity_id: request.activity_id,
                        baby_id: request.baby_id,
                        user_id: user_record['_id'],
                        parent_id: baby_record.parent_id,
                        attachments: request.attachments || '',
                        notes: request.notes?request.notes:"" ,
                        reason: request.reason?request.reason:"",
                        quantity: request.quantity?request.quantity:"",
                        weight: request.weight?request.weight:"",
                        reaction: request.reaction?request.reaction:'',
                        duration: request.duration || '',
                        left_duration: request.left_duration || '',
                        right_duration: request.right_duration || '',
                        mood: request.mood || '',
                        start_time: request.start_time || '',
                        end_time: request.end_time || '',
                        custom_field: request.custom_field || {},
                        is_deleted:false,
                        created_date: new Date(),
                        updated_date: new Date(),
                        created_by: req.user.sub,
                        updated_by: req.user.sub
                    }, { session: session });

                return res.status(200).json({
                    status: 200,
                    success: true,
                    data: baby['ops'][0]
                });
                 
            } catch (e) {
                console.log(e);

                if(configuration.send_mail) {
                    let object = {
                        subject: `Error ${message.api} ${configuration.environment}`,
                        to: configuration.support_email,// 'anuj@bettertechsolution.com,neeru.g@bettertechsolution.com', //
                        from: configuration.email_from,
                        // html: 'hey'
                        html: `<h3 style=" margin: 5px 0">Error ${message.api}(environment: ${configuration.environment})</h3><br/>
                    <p style="margin: 5px 0">Customer info : ` + ((req && req.user && req.user.sub) ? JSON.stringify(req.user) : 'No info') + `</p>
                    <p style="margin: 5px 0">` + e.stack + `</p>
                    <br>`
                    };

                    try {
                        sqs.sendMessage(object)
                    } catch (e) {
                        console.log(e);
                    }
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
            }
        };

        this.updateActivity = async (req,res) =>{
            let response = {}, message = {
                api: `PUT /baby_activity/:baby_activity_id(${req.params.baby_activity_id})`,
                request: {
                    headers: req.headers,
                    body: req.body,
                    user: req.user
                }
            };
            try {
                const schema = Joi.object().keys({
                    weight: Joi.optional(),
                    quantity: Joi.optional(),
                    // attachments: Joi.optional(),
                    notes: Joi.optional(),
                    reason: Joi.optional(),
                    reaction: Joi.optional(),
                    duration: Joi.optional(),
                    left_duration: Joi.optional(),
                    right_duration: Joi.optional(),
                    mood: Joi.optional(),
                    start_time: Joi.optional(),
                    end_time: Joi.optional(),
                    // custom_field: Joi.optional(),
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

                let baby_record = await db.connection.db.collection('Baby').findOne({
                    _id: request.baby_id,
                });
                if(!baby_record){
                    response = {
                        status: 400,
                        success: false,
                        message: 'Wrong baby ID',
                    };

                    message.response = response;

                    createLogs(message, 'api');

                    return res.status(400).json(response);
                }

                
                let activity_record = await db.connection.db.collection('Activity').findOne({
                    _id: mongoose.Types.ObjectId(request.activity_id)
                });

                if(!activity_record){

                    response = {
                        status: 400,
                        success: false,
                        message: 'Wrong activity ID',
                    };

                    message.response = response;

                    createLogs(message, 'api');

                    return res.status(400).json(response);
                }

                let user_record = await db.connection.db.collection('User').findOne({ _id: request.user_id });
                if (!user_record) {

                    response = {
                        status: 400,
                        success: false,
                        message: 'User Not found',
                    };

                    message.response = response;

                    createLogs(message, 'api');

                    return res.status(400).json(response);
                }


                let user_settings_record = await db.connection.db.collection('User-Settings').findOne({ user_id: request.user_id });
                if (!user_settings_record) {

                    response = {
                        status: 400,
                        success: false,
                        message: 'User Setting Not found',
                    };

                    message.response = response;

                    createLogs(message, 'api');

                    return res.status(400).json(response);
                }

                let { canWriteBabies } = user_record;

                if(!canWriteBabies.includes(`baby=${request.baby_id}`)){

                    response = {
                        status: 400,
                        success: false,
                        message: 'This user do not have write permission to this baby',
                    };

                    message.response = response;

                    createLogs(message, 'api');

                    return res.status(400).json(response);
                }

                let weight_unit = 'g', volume_unit = 'ml';

                if(user_settings_record){
                    weight_unit = user_settings_record.unit_system === 'imperial'? 'lb': weight_unit;
                    volume_unit = user_settings_record.unit_system === 'imperial'? 'fl-oz': volume_unit;
                }


                if(data.quantity){

                    try{
                        const response = await convertUnits({unitTo: 'ml', unitFrom: volume_unit, value: data.quantity, type: 'volume'});
                        if(response && response.error){
                            return response;
                        }
                        data.quantity = response.data;
                    }catch(e){
                        response = {
                            status: 400,
                            success: false,
                            message: 'Something gone wrong while converting units',
                        };

                        message.response = response;

                        createLogs(message, 'api');

                        return res.status(400).json(response);
                    }

                }

                if(data.weight){

                    try{
                        const response = await convertUnits({unitTo: 'g', unitFrom: weight_unit, value: data.weight, type: 'weight'});
                        if(response && response.error){
                            return response;
                        }
                        data.weight = response.data;
                    }catch(e){
                        response = {
                            status: 400,
                            success: false,
                            message: 'Something gone wrong while converting units',
                        };

                        message.response = response;

                        createLogs(message, 'api');

                        return res.status(400).json(response);
                    }

                }
                
                    await db.connection.db
                            .collection('Baby-Activity').updateOne({_id: req.params['baby_activity_id']}, {
                                $set: {
                                    attachments: request.attachments || '',
                                    notes: request.notes || '',
                                    reason: request.reason || '',
                                    quantity: request.quantity || '',
                                    weight: request.weight || '',
                                    reaction: request.reaction || '',
                                    duration: request.duration || '',
                                    left_duration: request.left_duration || '',
                                    right_duration: request.right_duration || '',
                                    mood: request.mood || '',
                                    start_time: request.start_time || '',
                                    end_time: request.end_time || '',
                                    custom_field: request.custom_field || {},
                                    updated_date: new Date(),
                                    updated_by: req.user.sub
                                }
                            },{ upsert: true });
                let resultAfter = await db.connection.db.collection('Baby-Activity').findOne({ _id: req.params['activity_id'] });

                response = {
                    status: 200,
                    success: true,
                    data: resultAfter
                };

                message.response = response;

                createLogs(message, 'api');

                return res.status(200).json(response);

            } catch (e) {

                if(configuration.send_mail) {
                    let object = {
                        subject: `Error ${message.api} ${configuration.environment}`,
                        to: configuration.support_email,// 'anuj@bettertechsolution.com,neeru.g@bettertechsolution.com', //
                        from: configuration.email_from,
                        // html: 'hey'
                        html: `<h3 style=" margin: 5px 0">Error ${message.api}(environment: ${configuration.environment})</h3><br/>
                    <p style="margin: 5px 0">Customer info : ` + ((req && req.user && req.user.sub) ? JSON.stringify(req.user) : 'No info') + `</p>
                    <p style="margin: 5px 0">` + e.stack + `</p>
                    <br>`
                    };

                    try {
                        sqs.sendMessage(object)
                    } catch (e) {
                        console.log(e);
                    }
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
            }
        };

        this.deleteActivity = async (req,res) =>{
            let response = {}, message = {
                api: `DELETE /baby_activity/:baby_activity_id(${req.params.baby_activity_id})`,
                request: {
                    headers: req.headers,
                    user: req.user
                }
            };

            try {

                const schema = Joi.object().keys({
                    baby_activity_id: Joi.string().required()
                });

                let request = req.params;
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

                let baby_activity_record = await db.connection.db.collection('Baby-Activity').findOne({
                    _id: mongoose.Types.ObjectId(request.baby_activity_id),
                });

                if(!baby_activity_record){

                    response = {
                        status: 400,
                        success: false,
                        message: 'Wrong activity ID',
                    };

                    message.response = response;

                    createLogs(message, 'api');

                    return res.status(400).json(response);
                }

                let user_record = await db.connection.db.collection('User').findOne({
                    _id: req.user.sub,
                });

                let { canWriteBabies } = user_record;

                if(!canWriteBabies.includes(`baby=${baby_activity_record.baby_id}`)){

                    response = {
                        status: 400,
                        success: false,
                        message: 'This user do not have write permission to this baby',
                    };

                    message.response = response;

                    createLogs(message, 'api');

                    return res.status(400).json(response);
                }


                await db.connection.db.collection('Baby-Activity').updateOne({_id: req.params['activity_id']}, {
                    $set: {
                        is_deleted: true,
                        updated_date: new Date(),
                        updated_by: req.user.sub
                    }
                }, {upsert: true});

                response = {
                    status: 200,
                    success: true,
                    message: "Baby activity deleted successfully"
                };

                message.response = response;

                createLogs(message, 'api');

                return res.status(200).json(response);
            } catch (e) {

                if(configuration.send_mail) {
                    let object = {
                        subject: `Error ${message.api} ${configuration.environment}`,
                        to: configuration.support_email,// 'anuj@bettertechsolution.com,neeru.g@bettertechsolution.com', //
                        from: configuration.email_from,
                        // html: 'hey'
                        html: `<h3 style=" margin: 5px 0">Error ${message.api}(environment: ${configuration.environment})</h3><br/>
                    <p style="margin: 5px 0">Customer info : ` + ((req && req.user && req.user.sub) ? JSON.stringify(req.user) : 'No info') + `</p>
                    <p style="margin: 5px 0">` + e.stack + `</p>
                    <br>`
                    };

                    try {
                        sqs.sendMessage(object)
                    } catch (e) {
                        console.log(e);
                    }
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
            }
        }
    }
}


module.exports = babyActivityController;
