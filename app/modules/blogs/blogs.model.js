const mongoose = require('../../_helpers/db');

let blogs = mongoose.Schema({
    user_id :{
        type: String,
        required: true
    },
    title: {
        required: true,
        type: String,
    },
    content: {
        type: String,
        required: true
    },
    is_deleted:{
        type: Boolean,
        required: true,
        default: false
    },
    approved:{
        type: Boolean,
        required: true,
        default: false
    }
}, { timestamps: { createdAt: true, updatedAt: true } });


module.exports = mongoose.model('blogs', blogs);