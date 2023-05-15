const mongoose = require('mongoose');

const schema = mongoose.Schema;

/* Complaints Schema */

const complaintsSchema = new schema({
    
    userId:{
        type: String,
        type: mongoose.Schema.Types.ObjectId, ref: 'Users',
    },
    ngoId:{
        type: String,
        type: mongoose.Schema.Types.ObjectId, ref: 'NGO',
    },
    subject:{
        type: String
    },
    reply:{
        type: String
    },
    description:{
        type: String
    },
    createdDate: {
        type: Date,
        default: Date.now
    },
    createdBy:{
        type: String,
        type: mongoose.Schema.Types.ObjectId, ref: 'Users',
    },
    status:{
        type: String,
        enum: ['active', 'inactive', 'deleted'],
        default: 'active'
    },
})

const complaints= module.exports = mongoose.model('Complaints',complaintsSchema);