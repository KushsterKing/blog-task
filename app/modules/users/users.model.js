const mongoose = require('./../../_helpers/db');

let users = mongoose.Schema({

    role: {type: String, enum: ['ADMIN', 'CONTENT_WRITER'], default: 'CONTENT_WRITER'},
    first_name:{type: String, required: true},
    last_name:{type: String, required: true},
    email:{type: String, required: true},
    is_deleted:{type: Boolean, required: false, default: false},
    password:{type: String, required: true},
    resetPasswordToken:String,
    resetPasswordExpiry:String
   
}, {timestamps: true});

module.exports = mongoose.model('users', users);