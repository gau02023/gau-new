var Case = require("../api/models/case");
var GeneralDocuments = require("../api/models/general_documents");
const ObjectID = require('mongodb').ObjectId;
var moment = require('moment');
module.exports.generateAppointmentResponse = async function (data) {
    var result = [];
    const promiseArr = [];
    return new Promise((resolve, reject) => {
        data.forEach(element => {
            promiseArr.push(
                new Promise(async (resolvve, rejectt) => {
                    var timeStart = "N/A"
                    if(element.scheduleId != null){
                        timeStart = element.scheduleId.timeStartSlot
                    }
                    
                    var checkCase = await Case.findOne({appointmentId: ObjectID(element._id), caseStatus: 'closed'})
                    .populate([
                        {
                            path: 'caseReports.createdBy', select: { firstName: 1, lastName : 1, userType : 1, email : 1,profileImage: 1, username: 1 }
                        },
                        {
                            path: 'attachedDocuments.attachedDocument', select: { documentTitle: 1, documentURL : 1, expiryDate : 1 }
                        }])
                    var reports = [];
                    var otherDocs = [];
                    let attachedDocuments = []
                    var caseId = "N/A";
                    var caseName = "N/A";
                    var caseNo = "N/A";
                    let referedComment = "N/A";
                    let refered = false;
                    let referedName =  "N/A"
                    let referedRole =  "N/A"
                    let otherUserImage = "N/A"
                    let otherUserName = "N/A"
                    let otherUserMobile = "N/A"
                    let otherUserId = "N/A"
                    let userAge = 0;
                    let otherUser = false;

                    if(checkCase != null){
                        reports = checkCase.caseReports;
                        otherDocs = checkCase.otherDocuments;
                        attachedDocuments = checkCase.attachedDocuments;
                        caseId = checkCase._id;
                        caseName = checkCase.caseName;
                        caseNo = checkCase.caseNo;
                        if (checkCase.otherUser == true) {
                            otherUserImage = checkCase.Image;
                            otherUserName = checkCase.otherUserName;
                            otherUserMobile = checkCase.otherUserMobile;
                            otherUserId = checkCase.otherUserId
                        }
                    }
                    if(element.referedBy != undefined){
                        refered = true;
                        referedName = element.referedBy.firstName + " " + element.referedBy.lastName;
                        referedRole = element.referedBy.userType
                        referedComment = element.referredComment ? element.referredComment : "";
                        if(checkCase != undefined){
                            var findC = await Case.findOne({_id: ObjectID(checkCase.referredCaseLinkedId)})
                            .populate([
                                {
                                    path: 'attachedDocuments.attachedDocument', select: { documentTitle: 1, documentURL : 1, expiryDate : 1 }
                                }])
                            if(findC){
                                otherDocs = findC.otherDocuments;
                                attachedDocuments = findC.attachedDocuments
                            }
                        }
                    }
                    if(element.appointmentUser.userConsentForm != undefined){
                        userAge =element.appointmentUser.userConsentForm.personalInformation.age;
                    }
                   
                    
                    var findDocus = await GeneralDocuments.find({createdBy: ObjectID(element.appointmentUser._id)});
                    var response = {
                        "project": element.projectId ? element.projectId.projectName : "N/A",
                        "appointmentStatus": element.appointmentStatus,
                        "caseNo": caseNo,
                        "caseName": caseName,
                        "appointmentId": element._id,
                        "caseId": caseId,
                        "appointmentUserId": element.appointmentUser ? element.appointmentUser._id : "N/A",
                        "appointmentUser": element.appointmentUser ? element.appointmentUser.firstName + " " + element.appointmentUser.lastName : "N/A",
                        "appointmentUserImage": element.appointmentUser ? element.appointmentUser.profileImage : "N/A",
                        "appointmentWith": element.appointmentWith.firstName + " " + element.appointmentWith.lastName,
                        "appointmentWithImage": element.appointmentWith.profileImage ? element.appointmentWith.profileImage : "N/A",
                        "appointmentWithEmail": element.appointmentWith.email ? element.appointmentWith.email : "N/A",
                        "appointmentWithPhone": element.appointmentWith.phoneNumber ? element.appointmentWith.phoneNumber : "N/A",
                        "appointmentWithIDDetails": element.appointmentWith.IDDetails ? element.appointmentWith.IDDetails : "N/A",
                        "addedBy": element.createdBy ? element.createdBy.firstName + " " + element.createdBy.lastName : "N/A",
                        "scheduledTime": timeStart,
                        "apppointmentDate": element.scheduleId.dateStart,
                        "addedDate": element.createdDate.toISOString().split('T')[0],
                        "role": element.createdBy ? element.createdBy.userType : "N/A",
                        "reports": reports,
                        "documents": otherDocs,
                        "attachedDocuments": attachedDocuments,
                        "refered": refered,
                        "referedName": referedName,
                        "referedRole": referedRole,
                        "referedComment": referedComment,
                        "otherUserImage": otherUserImage,
                        "otherUserName": otherUserName,
                        "otherUserMobile": otherUserMobile,
                        "otherUserId": otherUserId,
                        "createdDate": element.createdDate,
                        "userAge": userAge,
                        "primaryDocuments": findDocus
                    }
                    result.push(response);
                    resolvve(result);
                })
            )
        })
        return Promise.all(promiseArr).then(ress => {
            resolve(result.sort((a, b) => moment(b.createdDate, 'DD-MM-YYYY').diff(moment(a.createdDate, 'DD-MM-YYYY'))))
        })
    })
}

module.exports.generateAppointmentCaseNoResponse = async function (data) {
    var result = [];
    const promiseArr = [];

    return new Promise((resolve, reject) => {
        data.forEach(element => {
            promiseArr.push(
                new Promise(async (resolvve, rejectt) => {
                    var timeStart = "N/A"
                    if(element.scheduleId != null){
                        timeStart = element.scheduleId.timeStartSlot
                    }
                    var checkCase = await Case.findOne({appointmentId: ObjectID(element._id)})
                    .populate([
                        {
                            path: 'caseReports.createdBy', select: { firstName: 1, lastName : 1, userType : 1, email : 1,profileImage: 1, username: 1 }
                        }])
                    var reports = [];
                    var otherDocs = [];
                    var attachedDocuments = []
                    var caseId = "N/A";
                    var caseName = "N/A";
                    var caseNo = "N/A";
                    let referedComment = "N/A";
                    let refered = false;
                    let referedName =  "N/A"
                    let referedRole =  "N/A"
                    if(checkCase != null){
                        reports = checkCase.caseReports;
                        otherDocs = checkCase.otherDocuments;
                        attachedDocuments = checkCase.attachedDocuments;
                        caseId = checkCase._id;
                        caseName = element.caseName;
                        caseNo = element.caseNo;
                    } else {
                        caseName = element.caseName;
                        caseNo = element.caseNo;
                    }
                    if(element.referedBy != undefined){
                        refered = true;
                        referedName = element.referedBy.firstName + " " + element.referedBy.lastName;
                        referedRole = element.referedBy.userType
                        referedComment = element.referredComment ? referedComment : ""
                    }
                    var response = {
                        "project": element.projectId ? element.projectId.projectName : "N/A",
                        "appointmentStatus": element.appointmentStatus,
                        "caseNo": caseNo,
                        "caseName": caseName,
                        "appointmentId": element._id,
                        "caseId": caseId,
                        "appointmentUserId": element.appointmentUser ? element.appointmentUser._id : "N/A",
                        "appointmentUser": element.appointmentUser ? element.appointmentUser.firstName + " " + element.appointmentUser.lastName : "N/A",
                        "appointmentUserImage": element.appointmentUser ? element.appointmentUser.profileImage : "N/A",
                        "appointmentWith": element.appointmentWith.firstName + " " + element.appointmentWith.lastName,
                        "appointmentWithImage": element.appointmentWith.profileImage ? element.appointmentWith.profileImage : "N/A",
                        "addedBy": element.createdBy ? element.createdBy.firstName + " " + element.createdBy.lastName : "N/A",
                        "scheduledTime": timeStart,
                        "addedDate": element.createdDate.toISOString().split('T')[0],
                        "role": element.createdBy ? element.createdBy.userType : "N/A",
                        "reports": reports,
                        "documents": otherDocs,
                        "attachedDocuments": attachedDocuments,
                        "refered": refered,
                        "referedName": referedName,
                        "referedRole": referedRole,
                        "referedComment": referedComment,
                        "createdDate": element.createdDate
                    }
                    result.push(response);
                    resolvve(result);
                })
            )
        })
        return Promise.all(promiseArr).then(ress => {
            resolve(result.sort((a, b) => moment(b.createdDate, 'DD-MM-YYYY').diff(moment(a.createdDate, 'DD-MM-YYYY'))))
        })
    })
}



module.exports.generatePendingDocumentsResponse = async function (data) {
    var result = [];
    const promiseArr = [];

    return new Promise((resolve, reject) => {
        data.forEach(element => {
            promiseArr.push(
                new Promise(async (resolvve, rejectt) => {
                    var timeStart = "N/A"
                    if(element.scheduleId != null){
                        timeStart = element.scheduleId.timeStartSlot
                    }
                    var checkCase = await Case.findOne({appointmentId: ObjectID(element._id)})
                    .populate([
                        {
                            path: 'caseReports.createdBy', select: { firstName: 1, lastName : 1, userType : 1, email : 1,profileImage: 1, username: 1 }
                        }])
                    var reports = [];
                    var otherDocs = [];
                    var attachedDocuments = [];
                    var caseId = "N/A";
                    var caseName = "N/A";
                    var caseNo = "N/A";
                    let username = "N/A";
                    let missingDocs = 0;
                    if(checkCase != null){
                        reports = checkCase.caseReports;
                        otherDocs = checkCase.otherDocuments;
                        attachedDocuments = checkCase.attachedDocuments;
                        caseId = checkCase._id;
                        caseName = checkCase.caseName;
                        caseNo = checkCase.caseNo;
                        if(otherDocs.length > 0){
                            missingDocs = otherDocs.filter(e => !(e.documentURL)).length;
                        }
                        
                    }

                    var response = {
                        "project": element.projectId ? element.projectId.projectName : "N/A",
                        "appointmentStatus": element.appointmentStatus,
                        "caseNo": caseNo,
                        "caseName": caseName,
                        "appointmentId": element._id,
                        "caseId": caseId,
                        "appointmentUserId": element.appointmentUser ? element.appointmentUser._id : "N/A",
                        "appointmentUser": element.appointmentUser ? element.appointmentUser.firstName + " " + element.appointmentUser.lastName : "N/A",
                        "appointmentUserImage": element.appointmentUser ? element.appointmentUser.profileImage : "N/A",
                        "appointmentWith": element.appointmentWith.firstName + " " + element.appointmentWith.lastName,
                        "appointmentWithImage": element.appointmentWith.profileImage ? element.appointmentWith.profileImage : "N/A",
                        "addedBy": element.createdBy ? element.createdBy.firstName + " " + element.createdBy.lastName : "N/A",
                        "addedByUsername": username,
                        "scheduledTime": timeStart,
                        "addedDate": element.createdDate.toISOString().split('T')[0],
                        "role": element.appointmentWith.userType,
                        "reports": reports,
                        "documents": otherDocs,
                        "attachedDocuments": attachedDocuments,
                        "missingDocuments": missingDocs,
                        "createdDate": element.createdDate
                    }
                    if(missingDocs > 0){
                        result.push(response);
                    }
                   
                    resolvve(result);
                })
            )
        })
        return Promise.all(promiseArr).then(ress => {
            resolve(result.sort((a, b) => moment(b.createdDate, 'DD-MM-YYYY').diff(moment(a.createdDate, 'DD-MM-YYYY'))))
        })
    })
}