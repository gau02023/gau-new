const mongoose = require('mongoose');

const schema = mongoose.Schema;

/* Schedule Schema */

const scheduleSchema = new schema({
    ngoId: {
        type: mongoose.Schema.Types.ObjectId, ref: 'NGO',
        required: [true, "NGO is required"]
    },
    branchId: {
        type: String,
        required: [true, "Branch is required"]
    },
    scheduleType : {
        type: String,
        enum: ['daily', 'monthly', 'weekly']
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Users',
        required: [true, "Branch Name is required"]
    },
    dateStart : {
        type: Date
    },
    timeStartSlot : {
        type: String
    },
    dateEnd : {
        type: Date
    },
    timeEndSlot : {
        type: String
    },
    timeStartFirstHalf: {
        type: Number
    },
    timeEndFirstHalf: {
        type: Number
    },
    scheduleStatus : {
        type: String,
        enum: ['active', 'over','leave'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Users',
    }
})

const schedule = module.exports = mongoose.model('Schedule', scheduleSchema);