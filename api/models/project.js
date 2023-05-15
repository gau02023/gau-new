const mongoose = require('mongoose');

const schema = mongoose.Schema;

/* Project Schema */

const projectsSchema = new schema({
    
    ngoId:{
        type: String,
        type: mongoose.Schema.Types.ObjectId, ref: 'NGO',
    },
    projectName:{
        type: String
    },
    description:{
        type: String
    },
    startDate:{
        type: Date
    },
    endDate:{
        type: Date
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
    projectStatus:{
        type: String,
        enum: ['inprogress', 'completed', 'closed'],
        default: 'inprogress'
    },
})

const project= module.exports = mongoose.model('Project',projectsSchema);