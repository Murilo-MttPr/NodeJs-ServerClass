const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const statusSchema = new Schema({
    content: {
        type: String,
        required: true
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {timestamps: true})

module.exports = mongoose.model('Status', statusSchema);