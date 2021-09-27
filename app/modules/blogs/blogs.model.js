const mongoose = require('../../_helpers/db');

let usersSetting = mongoose.Schema({
    _partition: String,
    baby_id :{
        type: String,
        required: true
    },
    user_id :{
        type: String,
        required: true
    },
    activity_id: {
        required: true,
        type: String,
    },
    attachments :{
        type: Array,
        required: false
    },
    breast_milk_duration: {
        required: false,
        type: String,
    },
    custom_field: {
        type: Object,
        required: false
    },
    duration: {
        type: String,
        required: false
    },
    end_time:{
        type: Date,
        required: false
    },
    formula_milk_duration:{
        type: String,
        required: false
    },
    is_deleted:{
        type: Boolean,
        required: false
    },
    left_duration: {
        type: String,
        required: false
    },
    mood: {
        type: String,
        required: false
    },
    notes: {
        type: String,
        required: false
    },
    parent_id: {
        type: String,
        required: false
    },
    quantity: {
        type: String,
        required: false
    },
    reaction: {
        type: String,
        required: false
    },
    reason: {
        type: String,
        required: false,
        enum: ["wet","dry"]
    },
    right_duration:{
        type: String,
        required: false
    },
    start_time:{
        type: Date,
        required: false
    },
    weight:{
        type: Number,
        required: false
    },
}, { timestamps: { createdAt: true, updatedAt: { path: 'updatedAt', setOnInsert: false } } });


module.exports = mongoose.model('Baby-Activity', usersSetting);