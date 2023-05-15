const mongoose = require('mongoose');

const schema = mongoose.Schema;

/* General Documents Schema */

const documentSchema = new schema({
    
    lookupId:{
        type: String,
        type: mongoose.Schema.Types.ObjectId, ref: 'Lookup',
    },
    documentText:{
        type: String
    },
    createdDate: {
        type: Date,
        default: Date.now
    },
    status:{
        type: String,
        enum: ['active', 'inactive', 'deleted'],
        default: 'active'
    },
})

const document= module.exports = mongoose.model('Document',documentSchema);