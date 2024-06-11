const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
    parentName: {
        type: String,
        required: true
    },
    patientName: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true,
        unique: false
    },
    email: {
        type: String,
        required: true,
        unique: false
    },
    password: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('user', UserSchema);
