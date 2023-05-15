const mongoose = require('mongoose');

const schema = mongoose.Schema;

/* General Documents Schema */

const generalDocumentsSchema = new schema({
    
    documentTitle:{
        type: String
    },
    documentURL:{
        type: String
    },
    expiryDate:{
        type: Date
    },
    createdDate: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: String,
        type: mongoose.Schema.Types.ObjectId, ref: 'Users',
    },
    ngoId: {
        type: String,
        type: mongoose.Schema.Types.ObjectId, ref: 'NGO',
    },
    status:{
        type: String,
        enum: ['verified', 'unverified', 'deleted'],
        default: 'verified'
    },
})



const generalDocuments= module.exports = mongoose.model('GeneralDocuments',generalDocumentsSchema);