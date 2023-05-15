const mongoose = require('mongoose');

const schema = mongoose.Schema;

/* Case Reports Schema */

var caseReports = mongoose.Schema({
    reportComments: {
        type: String,
        required: [true, "Comments is required"]
    },
    reportFile: {
        type: String
    },
    reportTitle: {
        type: String
    },
    reportType: {
        type: String,
        enum: ['public', 'private'],
        default: 'private'
    },
    createdDate: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: String,
        type: mongoose.Schema.Types.ObjectId, ref: 'Users',
    }
})

/* Other Documents Schema */

var otherDocuments = mongoose.Schema({
    documentName: {
        type: String,
        default: ""
    },
    documentURL: {
        type: String,
        default: ""
    },
    createdDate: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: String,
        type: mongoose.Schema.Types.ObjectId, ref: 'Users',
    }
})

var attachedDocuments = mongoose.Schema({
    attachedDocument : {
        type: String,
        type: mongoose.Schema.Types.ObjectId, ref: 'GeneralDocuments'
    },
    createdDate: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: String,
        type: mongoose.Schema.Types.ObjectId, ref: 'Users',
    }
})


/* Case Schema */

const caseSchema = new schema({
    appointmentId:{
        type: String,
        type: mongoose.Schema.Types.ObjectId, ref: 'Appointment'
    },
    projectId : {
        type: String,
        type: mongoose.Schema.Types.ObjectId, ref: 'Project'
    },
    Image: {
        type: String
    },
    otherUser : {
        type: Boolean,
        default: false
    },
    otherUserName : {
        type: String
    },
    otherUserMobile : {
        type: String
    },
    otherUserId : {
        type: String
    },
    previousCaseLinked:{
        type: Boolean
    },
    previousCaseLinkedId:{
        type: String,
        type: mongoose.Schema.Types.ObjectId, ref: 'Case'
    },
    caseNo:{
        type: String
    },
    caseName:{
        type: String
    },
    caseLinkedUser:{
        type: String,
        type: mongoose.Schema.Types.ObjectId, ref: 'Users'
    },
    ngoId: {
        type: String,
        type: mongoose.Schema.Types.ObjectId, ref: 'NGO'
    },
    branchId: {
        type: String
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
    referredCaseLinkedId:{
        type: String,
        type: mongoose.Schema.Types.ObjectId, ref: 'Case'
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
    caseStatus: {
        type: String,
        enum: ['processing', 'inprogress', 'closed','refered', 'finished'],
        default: 'processing'
    },
    caseReports: [caseReports],
    otherDocuments: [otherDocuments],
    attachedDocuments: [attachedDocuments]
})


const cases = module.exports = mongoose.model('Case',caseSchema);