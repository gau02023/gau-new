const mongoose = require('mongoose');

const schema = mongoose.Schema;

/* Donations Schema */

const donationsSchema = new schema({
    
    userId:{
        type: String,
        type: mongoose.Schema.Types.ObjectId, ref: 'Users',
    },
    ngoId:{
        type: String,
        type: mongoose.Schema.Types.ObjectId, ref: 'NGO',
    },
    amount:{
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

const donation= module.exports = mongoose.model('Donation',donationsSchema);