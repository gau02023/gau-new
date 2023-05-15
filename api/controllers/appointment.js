/* Appointment Model */
var Appointment = require("../models/appointment.js");
const ObjectID = require('mongodb').ObjectId;

exports.createAppointment = async (c) => {
    return await Appointment.create(c);
};

exports.listUserAppointment = async (Id, status, userType, ngoId) => {
  
    if(userType == "ngoadmin"){
       if(status == "all"){
        return await Appointment.find({ngoId: ObjectID(ngoId), appointmentType: "appointment"})
        .populate([
            {
                path: 'projectId', select: { projectName: 1 }
            },
            {
                path: 'appointmentUser', select: { firstName: 1, lastName : 1, userType : 1, email : 1, profileImage: 1, username: 1,
                    userConsentForm: 1,IDDetails: 1, phoneNumber: 1 }
            },
            {
                path: 'appointmentWith' , select: { firstName: 1, lastName : 1, userType : 1 , email : 1,profileImage: 1 , username: 1,
                    IDDetails: 1, phoneNumber: 1 }
            },
            {
                path: 'createdBy' , select: { firstName: 1, lastName : 1, userType : 1 , email : 1,profileImage: 1 , username: 1 }
            },
            {
                path: 'scheduleId' , select: { timeStartSlot : 1, timeEndSlot : 1  }
            },
            {
                path: 'referedBy' , select: { firstName: 1, lastName : 1, userType : 1 , email : 1,profileImage: 1, username: 1 }
            },
            {
                path: 'referredAppointmentLinkedId', select : {caseNo: 1}
            }])
       } else {
        return await Appointment.find({ngoId: ObjectID(ngoId), appointmentStatus : status, appointmentType: "appointment"})
        .populate([
            {
                path: 'projectId', select: { projectName: 1 }
            },
            {
                path: 'appointmentUser', select: { firstName: 1, lastName : 1, userType : 1, email : 1, profileImage: 1, username: 1,
                    userConsentForm: 1,IDDetails: 1, phoneNumber: 1 }
            },
            {
                path: 'appointmentWith' , select: { firstName: 1, lastName : 1, userType : 1 , email : 1,profileImage: 1 , username: 1 ,
                    IDDetails: 1, phoneNumber: 1}
            },
            {
                path: 'createdBy' , select: { firstName: 1, lastName : 1, userType : 1 , email : 1,profileImage: 1, username: 1 }
            },
            {
                path: 'scheduleId' , select: { timeStartSlot : 1, timeEndSlot : 1  }
            },
            {
                path: 'referedBy' , select: { firstName: 1, lastName : 1, userType : 1 , email : 1,profileImage: 1, username: 1 }
            },
            {
                path: 'referredAppointmentLinkedId', select : {caseNo: 1}
            }])
       }

    } 
    if(userType == "socialWorker" || userType == "psychologist" || userType == "lawyer") {
        if(status == "all"){
            return await Appointment.find({ appointmentWith: ObjectID(Id),appointmentType: "appointment"})
            .populate([
                {
                    path: 'projectId', select: { projectName: 1 }
                },
                {
                    path: 'appointmentUser', select: { firstName: 1, lastName : 1, userType : 1, email : 1, profileImage: 1, username: 1,
                        userConsentForm: 1, IDDetails: 1, phoneNumber: 1 }
                },
                {
                    path: 'appointmentWith' , select: { firstName: 1, lastName : 1, userType : 1 , email : 1, profileImage: 1, username: 1,
                        IDDetails: 1, phoneNumber: 1}
                },
                {
                    path: 'createdBy' , select: { firstName: 1, lastName : 1, userType : 1 , email : 1,profileImage: 1, username: 1 }
                },
                {
                    path: 'scheduleId' , select: { timeStartSlot : 1, timeEndSlot : 1  }
                },
                {
                    path: 'referedBy' , select: { firstName: 1, lastName : 1, userType : 1 , email : 1,profileImage: 1, username: 1 }
                },
                {
                    path: 'referredAppointmentLinkedId', select : {caseNo: 1}
                }])
        } else {
            return await Appointment.find({ appointmentWith: ObjectID(Id), appointmentStatus : status,appointmentType: "appointment"})
            .populate([
                {
                    path: 'projectId', select: { projectName: 1 }
                },
                {
                    path: 'appointmentUser', select: { firstName: 1, lastName : 1, userType : 1, email : 1, profileImage: 1, username: 1,
                        userConsentForm: 1,IDDetails: 1, phoneNumber: 1 }
                },
                {
                    path: 'appointmentWith' , select: { firstName: 1, lastName : 1, userType : 1 , email : 1, profileImage: 1, username: 1,
                        IDDetails: 1, phoneNumber: 1 }
                },
                {
                    path: 'createdBy' , select: { firstName: 1, lastName : 1, userType : 1 , email : 1,profileImage: 1, username: 1 }
                },
                {
                    path: 'scheduleId' , select: { timeStartSlot : 1, timeEndSlot : 1  }
                },
                {
                    path: 'referedBy' , select: { firstName: 1, lastName : 1, userType : 1 , email : 1,profileImage: 1, username: 1 }
                },
                {
                    path: 'referredAppointmentLinkedId', select : {caseNo: 1}
                }])
        }
    }

    if(userType == "user"){
        return await Appointment.find({appointmentUser: ObjectID(Id), appointmentType: "appointment"})
        .populate([
            {
                path: 'projectId', select: { projectName: 1 }
            },
            {
                path: 'appointmentUser', select: { firstName: 1, lastName : 1, userType : 1, email : 1, profileImage: 1, username: 1,
                    userConsentForm: 1,IDDetails: 1, phoneNumber: 1 }
            },
            {
                path: 'appointmentWith' , select: { firstName: 1, lastName : 1, userType : 1 , email : 1,  profileImage: 1, username: 1,
                    IDDetails: 1, phoneNumber: 1 }
            },
            {
                path: 'createdBy' , select: { firstName: 1, lastName : 1, userType : 1 , email : 1,profileImage: 1, username: 1 }
            },
            {
                path: 'referedBy' , select: { firstName: 1, lastName : 1, userType : 1 , email : 1,profileImage: 1, username: 1 }
            },
            {
                path: 'scheduleId' , select: { timeStartSlot : 1, timeEndSlot : 1  }
            },
            {
                path: 'referredAppointmentLinkedId', select : {caseNo: 1}
            }])
    } 


};

exports.listUserAppointmentCaseNo = async (caseId) => {
        return await Appointment.find({caseNo: caseId, appointmentType: "appointment"})
        .populate([
            {
                path: 'projectId', select: { projectName: 1 }
            },
            {
                path: 'appointmentUser', select: { firstName: 1, lastName : 1, userType : 1, email : 1, profileImage: 1, username: 1,
                    IDDetails: 1, phoneNumber: 1 }
            },
            {
                path: 'appointmentWith' , select: { firstName: 1, lastName : 1, userType : 1 , email : 1,profileImage: 1 , username: 1,
                    IDDetails: 1, phoneNumber: 1 }
            },
            {
                path: 'createdBy' , select: { firstName: 1, lastName : 1, userType : 1 , email : 1,profileImage: 1 , username: 1 }
            },
            {
                path: 'scheduleId' , select: { timeStartSlot : 1, timeEndSlot : 1  }
            },
            {
                path: 'referedBy' , select: { firstName: 1, lastName : 1, userType : 1 , email : 1,profileImage: 1, username: 1 }
            },
            {
                path: 'referredAppointmentLinkedId', select : {caseNo: 1}
            }])

};

exports.updateAppointment = async (id, c) => {
    return await Appointment.findByIdAndUpdate(id, c);
};


exports.listProjectAppointments= async (projectId) => {
    return await Appointment.find({
        projectId: ObjectID(projectId)
    })
    .populate([
        {
            path: 'projectId', select: { projectName: 1 }
        },
        {
            path: 'appointmentUser', select: { firstName: 1, lastName : 1, userType : 1, email : 1, profileImage: 1, username: 1 }
        },
        {
            path: 'appointmentWith' , select: { firstName: 1, lastName : 1, userType : 1 , email : 1,profileImage: 1 , username: 1 }
        },
        {
            path: 'createdBy' , select: { firstName: 1, lastName : 1, userType : 1 , email : 1,profileImage: 1 , username: 1 }
        },
        {
            path: 'scheduleId' , select: { timeStartSlot : 1, timeEndSlot : 1, dateStart: 1  }
        },
        {
            path: 'referedBy' , select: { firstName: 1, lastName : 1, userType : 1 , email : 1,profileImage: 1, username: 1 }
        },
        {
            path: 'referredAppointmentLinkedId', select : {caseNo: 1}
        }])
};