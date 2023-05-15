/* Case Model */
var Case = require("../models/case.js");
var Appointment = require("../models/appointment.js");
const ObjectID = require('mongodb').ObjectId;

exports.createCase = async (c) => {
    return await Case.create(c);
};

exports.listUserCases = async (Id,projectId) => {
    return await Appointment.find({ appointmentUser: ObjectID(Id), projectId: ObjectID(projectId),
        appointmentType: "appointment",
        appointmentStatus: "closed" },
        { _id: 1, caseName: 1, caseNo: 1, createdDate: 1, projectId: 1 })
};

exports.listUserCasesProjectBased = async (projectId) => {
    return await Appointment.find({ projectId: ObjectID(projectId),
        appointmentType: "appointment"},
        { _id: 1, caseName: 1, caseNo: 1, createdDate: 1, projectId: 1, appointmentStatus: 1,
            createdDate: 1 })
};

exports.listUserCaseAppointments = async (Id, limit, skip) => {
    return await Case.find({ referedTo: ObjectID(Id) },
        { _id: 1, caseName: 1, caseNo: 1, createdDate: 1, caseStatus: 1 })
        .limit(limit)
        .skip(skip)
        .populate([
            {
                path: 'caseLinkedUser', select: { firstName: 1, lastName: 1, email: 1,profileImage: 1, username: 1 }
            }
        ])
};

exports.listCaseUserReports = async (Id) => {
    return await Case.find({ caseLinkedUser: ObjectID(Id), caseStatus: { $in: ["closed", "processing"] } },
        { _id: 1, caseName: 1, caseNo: 1, createdDate: 1, caseReports: 1, caseLinkedUser: 1 })
        .populate([
            {
                path: 'caseLinkedUser'
            },
            {
                path: 'caseReports',
                populate: {
                    path: 'createdBy',
                    model: 'Users',
                    select: { firstName: 1, lastName: 1, userType: 1,profileImage: 1, username: 1 }
                }
            }])
};


exports.listReportsCaseNo = async (caseNo) => {
    return await Case.find({
        caseNo: caseNo
    })
        .populate([
            {
                path: 'caseLinkedUser'
            },
            {
                path: 'otherDocuments',
                populate: {
                    path: 'attachedDocument',
                    model: 'GeneralDocuments',
                    select: { documentTitle: 1, documentURL: 1, expiryDate: 1 }
                }
            },
            {
                path: 'caseReports',
                populate: {
                    path: 'createdBy',
                    model: 'Users',
                    select: { firstName: 1, lastName: 1, userType: 1,profileImage: 1, username: 1 }
                }
            }])
};




exports.listReportsProject = async (projectId) => {
    return await Case.find({
        projectId: ObjectID(projectId)
    })
        .populate([
            {
                path: 'caseLinkedUser'
            },
            {
                path: 'otherDocuments',
                populate: {
                    path: 'attachedDocument',
                    model: 'GeneralDocuments',
                    select: { documentTitle: 1, documentURL: 1, expiryDate: 1 }
                }
            },
            {
                path: 'caseReports',
                populate: {
                    path: 'createdBy',
                    model: 'Users',
                    select: { firstName: 1, lastName: 1, userType: 1,profileImage: 1, username: 1 }
                }
            }])
};

exports.listReportsCaseDateWise = async (start,end) => {
    return await Case.find({
        "createdDate": {
            $gte: new Date(start),
            $lte: new Date(end)
        }
    })
        .populate([
            {
                path: 'caseLinkedUser'
            },
            {
                path: 'otherDocuments',
                populate: {
                    path: 'attachedDocument',
                    model: 'GeneralDocuments',
                    select: { documentTitle: 1, documentURL: 1, expiryDate: 1 }
                }
            },
            {
                path: 'caseReports',
                populate: {
                    path: 'createdBy',
                    model: 'Users',
                    select: { firstName: 1, lastName: 1, userType: 1,profileImage: 1, username: 1 }
                }
            }])
};




exports.listUserReports = async (userId, type, ngoId, limit, skip, userType) => {
    if (userType != "ngoadmin") {
        if (type == "private") {
            return await Case.find({
                caseStatus: { $in: ["closed", "processing"] },
                ngoId: ObjectID(ngoId),
                'caseReports': {
                    $elemMatch: {
                        createdBy: ObjectID(userId),
                        reportType: "private"
                    }
                }
            })
                .limit(limit)
                .skip(skip)
                .populate([
                    {
                        path: 'caseLinkedUser',select: { firstName: 1, lastName : 1, userType : 1, email : 1, profileImage: 1, username: 1 }
                    },
                    {
                        path: 'createdBy'
                    },
                    {
                        path: 'projectId'
                    },
                    {
                        path: 'caseReports',
                        populate: {
                            path: 'createdBy',
                            model: 'Users',
                            select: { firstName: 1, lastName: 1, userType: 1,profileImage: 1, username: 1 }
                        }
                    }])
        } else {
            return await Case.find({
                caseStatus: { $in: ["closed", "processing"] },
                ngoId: ObjectID(ngoId),
                'caseReports': {
                    $elemMatch: {
                        reportType: "public",
                    }
                }
            })
                .limit(limit)
                .skip(skip)
                .populate([
                    {
                        path: 'caseLinkedUser',select: { firstName: 1, lastName : 1, userType : 1, email : 1, profileImage: 1, username: 1 }
                    },
                    {
                        path: 'createdBy'
                    },
                    {
                        path: 'projectId'
                    },
                    {
                        path: 'caseReports',
                        populate: {
                            path: 'createdBy',
                            model: 'Users',
                            select: { firstName: 1, lastName: 1, userType: 1,profileImage: 1, username: 1 }
                        }
                    }])
        }
    } else {
        if (type == "private") {
            return await Case.find({
                caseStatus: { $in: ["closed", "processing"] },
                ngoId: ObjectID(ngoId),
                'caseReports': {
                    $elemMatch: {
                        reportType: "private"
                    }
                }
            })
                .limit(limit)
                .skip(skip)
                .populate([
                    {
                        path: 'caseLinkedUser',select: { firstName: 1, lastName : 1, userType : 1, email : 1, profileImage: 1, username: 1 }
                    },
                    {
                        path: 'createdBy'
                    },
                    {
                        path: 'projectId'
                    },
                    {
                        path: 'caseReports',
                        populate: {
                            path: 'createdBy',
                            model: 'Users',
                            select: { firstName: 1, lastName: 1, userType: 1,profileImage: 1 , username: 1}
                        }
                    }])
        } else {
            return await Case.find({
                caseStatus: { $in: ["closed", "processing"] },
                ngoId: ObjectID(ngoId),
                'caseReports': {
                    $elemMatch: {
                        reportType: "public",
                    }
                }
            })
                .limit(limit)
                .skip(skip)
                .populate([
                    {
                        path: 'caseLinkedUser',select: { firstName: 1, lastName : 1, userType : 1, email : 1, profileImage: 1, username: 1 }
                    },
                    {
                        path: 'createdBy'
                    },
                    {
                        path: 'projectId'
                    },
                    {
                        path: 'caseReports',
                        populate: {
                            path: 'createdBy',
                            model: 'Users',
                            select: { firstName: 1, lastName: 1, userType: 1,profileImage: 1, username: 1 }
                        }
                    }])
        }
    }


};

exports.updateCase = async (id, c) => {
    return await Case.findByIdAndUpdate(id, c);
};


exports.listProjectUsers = async (projectId) => {
    return await Case.find({
        projectId: ObjectID(projectId)
    })
};
