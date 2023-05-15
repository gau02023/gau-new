const mongoose = require('mongoose');

const schema = mongoose.Schema;

/* Appointment Schema */

const appointmentSchema = new schema({
    previousAppointmentLinked:{
        type: Boolean
    },
    previousAppointmentLinkedId:{
        type: String,
        type: mongoose.Schema.Types.ObjectId, ref: 'Appointment'
    },
    appointmentUser:{
        type: String,
        type: mongoose.Schema.Types.ObjectId, ref: 'Users'
    },
    appointmentWith:{
        type: String,
        type: mongoose.Schema.Types.ObjectId, ref: 'Users'
    },
    caseNo:{
        type: String
    },
    caseName:{
        type: String
    },
    scheduleId : {
        type: String,
        type: mongoose.Schema.Types.ObjectId, ref: 'Schedule'
    },
    ngoId : {
        type: String,
        type: mongoose.Schema.Types.ObjectId, ref: 'NGO'
    },
    projectId : {
        type: String,
        type: mongoose.Schema.Types.ObjectId, ref: 'Project'
    },
    referedBy: {
        type: String,
        type: mongoose.Schema.Types.ObjectId, ref: 'Users'
    },
    referedTo: {
        type: String,
        type: mongoose.Schema.Types.ObjectId, ref: 'Users'
    },
    referedCaseAppointmentDate : {
        type: Date
    },
    referedCaseAppointmentTime : {
        type: String
    },
    referredAppointmentLinkedId:{
        type: String,
        type: mongoose.Schema.Types.ObjectId, ref: 'Appointment'
    },
    referredComment:{
        type: String
    },
    createdDate: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Users'
    },
    createdByUser: {
        type: Boolean,
        default: false
    },
    appointmentStatus: {
        type: String,
        enum: ['scheduled', 'inprogress', 'closed','cancelled','refered','finished'],
        default: 'scheduled'
    },
    appointmentType: {
        type: String,
        enum: ['verification', 'appointment'],
        default: 'appointment'
    }
})


const appointment = module.exports = mongoose.model('Appointment',appointmentSchema);