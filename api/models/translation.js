const mongoose = require('mongoose');

const schema = mongoose.Schema;

// Product Schema

const translationSchema = new schema({   
    actualText:{
        type: String
    },
    translatedText:{
        type: String
    },
    languageId:{
        type: mongoose.Schema.Types.ObjectId, ref: 'Lookup',
    },
    status:{
        type: String,
        default:"active"
    },
})


const translation= module.exports = mongoose.model('Translation',translationSchema);