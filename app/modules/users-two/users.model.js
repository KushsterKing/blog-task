const mongoose = require('./../../_helpers/db');

let users = mongoose.Schema({

    userId: {type: Number, required: true},
    owes:{type: Array, required: true, default: [{}]},
    // last_name:{type: String, required: true},
    // email:{type: String, required: true},
    // is_deleted:{type: Boolean, required: false, default: false},
    // password:{type: String, required: true},
    // resetPasswordToken:String,
    // resetPasswordExpiry:String
   
}, {timestamps: true});

module.exports = mongoose.model('users-two', users);
