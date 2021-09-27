const mongoose = require('./../../_helpers/db');

let users = mongoose.Schema({

    _partition:String,
    first_name:String,
    last_name:String,
    email:String,
    phone_number:String,
    picture:String,
    shopify_id:String,
    shopify_password:String,
    step_status:Number,
    provider:Object,
    resetPasswordToken:String,
    resetPasswordExpiry:String,
    twitter_id:String,
    facebook_id:String,
    google_id:String,
    apple_id:String,
   
}, {timestamps: {createdAt: true, updatedAt: { path: 'updatedAt', setOnInsert: false }}});

// transactionsLogs.index({ 'ip_address_log':1});
// transactionsLogs.index({ 'status_code': 1,'status':1});
// transactionsLogs.index({ 'tbl_type_val': 1});
// transactionsLogs.index({ 'createdAt': 1});
// transactionsLogs.index({'request.customer_id' :1})

module.exports = mongoose.model('User', users);