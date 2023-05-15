var User = require("../api/models/user");
var Appointment = require("../api/models/appointment");
var Case = require("../api/models/case");
var CaseController = require("../api/controllers/case");
const ObjectID = require('mongodb').ObjectId;
var moment = require('moment');

module.exports.generateCaseReportsResponse = async function (data) {
    var result = [];
    if(data.length > 0) {
        data.forEach(element => {
            if(element.caseReports.length > 0) {
                element.caseReports.forEach(el => {
                    let fullName = "N/A";
                    let role = "N/A";
                    let profileImage = "N/A";
                    let username = "N/A";
                    if(el.createdBy != undefined) {
                        fullName=  el.createdBy.firstName + " " + el.createdBy.lastName;
                        role = el.createdBy.userType;
                        username = el.createdBy.username;
                        profileImage = el.caseLinkedUser.profileImage ? el.caseLinkedUser.profileImage : "N/A";
                    }
                    var response = {
                        "caseNo": element.caseNo,
                        "addedBy": fullName,
                        "role": role,
                        "username": username,
                        "profileImage": profileImage,
                        "addedDate": el.createdDate.toISOString().split('T')[0],
                        "caseLinkedUser": element.caseLinkedUser.firstName + " " + element.caseLinkedUser.lastName,
                        "reportType": el.reportType,
                        "comments": el.reportComments,
                        "reportId": el._id,
                        "reportFile": el.reportFile,
                        "reportTitle": el.reportTitle? el.reportTitle : "",
                        "createdDate": el.createdDate
                    }
                    result.push(response);
                })
            }

        })
        return result.sort((a, b) => moment(b.createdDate, 'DD-MM-YYYY').diff(moment(a.createdDate, 'DD-MM-YYYY')));
    }
    else {
        return result;
    } 
}


module.exports.generateCaseGenerciResponse = async function (data, type) {
    var result = [];
    if(data.length > 0) {
        data.forEach(element => {
            element.caseReports.forEach(el => {
                if(el.reportType == type){
                    var caseLinkedUser = "N/A";
                    let profileImage = "N/A";
                    let username = "N/A";
                    let projectName = "N/A"
                  
                    if(element.caseLinkedUser != null){
                        caseLinkedUser = element.caseLinkedUser.firstName + " " + element.caseLinkedUser.lastName;
                        profileImage = element.caseLinkedUser ? element.caseLinkedUser.profileImage : "N/A";
                        username = el.createdBy.username ? el.createdBy.username : "N/A"
                    }
                    if(element.projectId != null){
                        projectName = element.projectId.projectName
                    }
                    var response = {
                        "caseNo": element.caseNo,
                        "addedBy": el.createdBy.firstName + " " + el.createdBy.lastName,
                        "profileImage": profileImage,
                        "username":username,
                        "role": el.createdBy.userType,
                        "addedDate": el.createdDate.toISOString().split('T')[0],
                        "caseLinkedUser": caseLinkedUser,
                        "reportType": el.reportType,
                        "comments": el.reportComments,
                        "reportId": el._id,
                        "reportFile": el.reportFile,
                        "reportTitle": el.reportTitle? el.reportTitle : "",
                        "createdDate": element.createdDate,
                        "projectName": projectName,
                        "createdDate": el.createdDate
                    }
                    result.push(response);
                }
            })
        })
        return result.sort((a, b) => moment(b.createdDate, 'DD-MM-YYYY').diff(moment(a.createdDate, 'DD-MM-YYYY')));
    } 
    else {
        return result;
    }
}


module.exports.generateSingleCaseReportsResponse = async function (data) {
    var result = [];
    if(data.length > 0) {
        data.forEach(element => {
            if(element.caseReports.length > 0) {
                element.caseReports.forEach(el => {
                    let fullName = "N/A";
                    let role = "N/A";
                    let profileImage = "N/A";
                    let username = "N/A";
                    if(el.createdBy != undefined) {
                        fullName=  el.createdBy.firstName + " " + el.createdBy.lastName;
                        role = el.createdBy.userType;
                        username = el.createdBy.username;
                        
                    }
                    var response = {
                        "caseNo": element.caseNo,
                        "addedBy": fullName,
                        "role": role,
                        "username": username,
                        "profileImage":  element.caseLinkedUser ? element.caseLinkedUser.profileImage : "N/A",
                        "addedDate": el.createdDate.toISOString().split('T')[0],
                        "caseLinkedUser": element.caseLinkedUser.firstName + " " + element.caseLinkedUser.lastName,
                        "reportType": el.reportType,
                        "comments": el.reportComments,
                        "reportId": el._id,
                        "reportFile": el.reportFile,
                        "reportTitle": el.reportTitle? el.reportTitle : "",
                        "createdDate": el.createdDate
                    }
                    result.push(response);
                })
            }

        })
        return result.sort((a, b) => moment(b.createdDate, 'DD-MM-YYYY').diff(moment(a.createdDate, 'DD-MM-YYYY')));
    }
    else {
        return result;
    } 
}

module.exports.generateProjectCasesResponse = async function (data) {
    const promiseArr = [];
    var result = [];
    return new Promise((resolve, reject) => {
        data.forEach(element => {
            promiseArr.push(
                new Promise(async (resolvve, rejectt) => {
                    var el = {
                        caseName: element.caseName,
                        caseNo: element.caseNo,
                        createdDate: element.createdDate,
                        totalAppointments : 0,
                        totalReports: 0,
                        totalUsers: 0,
                        status: element.appointmentStatus
                    };
                    var getAppnts = await Appointment.countDocuments({
                        caseNo: element.caseNo
                    })
                    el.totalAppointments = getAppnts;
                    var userCases = [];
                    userCases = await CaseController.listReportsCaseNo(element.caseNo);
                    var resp = await this.generateSingleCaseReportsResponse(userCases);
                    if(resp){
                        el.totalReports = resp.length;
                    }
                    result.push(el)
                    resolvve(result);
                })
            )
        })
        return Promise.all(promiseArr).then(ress => {
            resolve(result.sort((a, b) => moment(b.createdDate, 'DD-MM-YYYY').diff(moment(a.createdDate, 'DD-MM-YYYY'))))
        })
    })
}

module.exports.generateProjectAllResponse = async function (data) {
    const promiseArr = [];
    var result = [];
    return new Promise((resolve, reject) => {
        data.forEach(element => {
            promiseArr.push(
                new Promise(async (resolvve, rejectt) => {
                    var el = {
                        _id: element._id,
                        projectName: element.projectName,
                        description: element.description,
                        projectStatus: element.projectStatus,
                        startDate: element.startDate,
                        endDate: element.endDate,
                        status: element.status,
                        totalAppointments : 0,
                        totalReports: 0,
                        totalCases:0,
                        totalUsers: 0,
                        createdDate: element.createdDate
                    };
                    var totalCases = await CaseController.listUserCasesProjectBased(element._id);
                    var finalResp = totalCases.filter((value, index, self) =>
                        index === self.findIndex((t) => (
                            t.caseNo === value.caseNo
                    ))
                    )
                    if(finalResp != undefined){
                        el.totalCases = finalResp.length;
                    }

                    var totalUsersProject = await CaseController.listProjectUsers(element._id);

                    const filteredData = totalUsersProject.filter((value, index, self) => 
                        self.findIndex(v => v.caseLinkedUser.toString() === value.caseLinkedUser.toString()) === index
                        );
                    
                    if(filteredData != undefined){
                        el.totalUsers = filteredData.length;
                    }   


                    var getAppnts = await Appointment.countDocuments({
                        projectId: element._id
                    })
                    el.totalAppointments = getAppnts;
                    var userCases = [];
                    userCases = await CaseController.listReportsProject(element._id);

                    var resp = await this.generateSingleCaseReportsResponse(userCases);
                    if(resp){
                        el.totalReports = resp.length;
                    }
                    result.push(el)
                    resolvve(result);
                })
            )
        })
        return Promise.all(promiseArr).then(ress => {
            resolve(result.sort((a, b) => moment(b.createdDate, 'DD-MM-YYYY').diff(moment(a.createdDate, 'DD-MM-YYYY'))))
        })
    })
}


module.exports.generateProjectUsersResponse = async function (data) {
    const promiseArr = [];
    var result = [];
    return new Promise((resolve, reject) => {
        data.forEach(element => {
            promiseArr.push(
                new Promise(async (resolvve, rejectt) => {
                    var findUser = await User.findOne({_id: ObjectID(element.caseLinkedUser)})
                    var el ={
                        fullName : findUser.firstName + " " + findUser.lastName,
                        projectId: element.projectId,
                        caseNo: element.caseNo,
                        caseName: element.caseName,
                        createdDate: element.createdDate,
                        profileImage: element.Image,
                        email: findUser.email,
                        phoneNumber: findUser.phoneNumber,
                        city: findUser.userConsentForm ? findUser.userConsentForm.personalInformation.city : "",
                        country: findUser.userConsentForm ? findUser.userConsentForm.personalInformation.country : "",
                        address: findUser.userConsentForm ? findUser.userConsentForm.personalInformation.address : "",
                        documentType: findUser.userConsentForm ? findUser.userConsentForm.personalInformation.documentType : "",
                        documentURL: findUser.userConsentForm ? findUser.userConsentForm.personalInformation.documentURL : "",
                        totalAppointments: 0,
                        totalCases: 0
                    }
                    var getAppnts = await Appointment.countDocuments({
                        appointmentUser: ObjectID(element.caseLinkedUser)
                    })
                    el.totalAppointments = getAppnts;

                    var getCases = await Case.countDocuments({
                        caseLinkedUser: ObjectID(element.caseLinkedUser)
                    })
                    el.totalCases = getCases;
                    result.push(el)
                    resolvve(result);
                })
            )
        })
        return Promise.all(promiseArr).then(ress => {
            resolve(result.sort((a, b) => moment(b.createdDate, 'DD-MM-YYYY').diff(moment(a.createdDate, 'DD-MM-YYYY'))))
        })
    })
}



module.exports.projectAppointments = async function (data) {
    const promiseArr = [];
    var result = [];
    return new Promise((resolve, reject) => {
        data.forEach(element => {
            promiseArr.push(
                new Promise(async (resolvve, rejectt) => {
                    var findUser = await User.findOne({_id: ObjectID(element.caseLinkedUser)})
                    var el ={}
                    var el ={
                        appointmentUser : element.appointmentUser.firstName + " " + element.appointmentUser.lastName,
                        appointmentUserEmail: element.appointmentUser.email,
                        appointmentUserImage: element.appointmentUser.profileImage,
                        appointmentWith : element.appointmentWith.firstName + " " + element.appointmentWith.lastName,
                        appointmentWithEmail: element.appointmentWith.email,
                        appointmentWithImage: element.appointmentWith.profileImage,
                        appointmentDate: element.scheduleId.dateStart,
                        appointmentTime: element.scheduleId.timeStartSlot + " " + element.scheduleId.timeEndSlot,
                        caseName: element.caseName,
                        caseNo: element.caseNo,
                        createdDate: element.createdDate
                    }
                    result.push(el)
                    resolvve(result);
                })
            )
        })
        return Promise.all(promiseArr).then(ress => {
            resolve(result.sort((a, b) => moment(b.createdDate, 'DD-MM-YYYY').diff(moment(a.createdDate, 'DD-MM-YYYY'))))
        })
    })
}

