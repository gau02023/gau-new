const mongoose = require('mongoose');

const schema = mongoose.Schema;

/* NGO Branch Schema */

var ngoBranches = mongoose.Schema({
    branchName: {
        type: String,
        required: [true, "Branch Name is required"]
    },
    branchLocation: {
        type: String,
        required: [true, "Branch Location is required"]
    },
    branchDescription: {
        type: String
    },
    branchPicture: {
        type: String
    },
    branchContact: {
        type: String
    },
    branchEmail: {
        type: String
    },
    branchStartTime: {
        type: String
    },
    branchEndTime: {
        type: String
    },
    branchPointOfContact: {
        type: String
    },
    branchStatus: {
        type: String,
        enum: ['active', 'inactive', 'deleted'],
        default: 'active'
    },
})


// NGO Schema
const ngoSchema = new schema({
    ngoName: {
        type: String,
        required: [true, "NGO Name is required"]
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: String,
        type: mongoose.Schema.Types.ObjectId, ref: 'Users',
    },
    ngoStatus: {
        type: String,
        enum: ['pending', 'active', 'inactive', 'deleted'],
        default: 'active'
    },
    ngoBranches: [ngoBranches]
})

const ngo = module.exports = mongoose.model('NGO', ngoSchema);