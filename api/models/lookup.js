const mongoose = require('mongoose');

const schema = mongoose.Schema;

/* General Lookup Schema */

const lookupSchema = new schema({
    
    lookupName:{
        type: String
    },
    lookupType:{
        type: String
    },
    createdDate: {
        type: Date,
        default: Date.now
    },
    state:{
        type: String,
        default:"active"
    },
})



const lookup= module.exports = mongoose.model('Lookup',lookupSchema);