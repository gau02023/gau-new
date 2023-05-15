var Complaint=require('../models/complaints.js');
const ObjectID = require('mongodb').ObjectId;

/******************* Post Complaint ***************************/
exports.postComplaint = async (complaint) => {
    return await Complaint.create(complaint);
};

/******************* List Complaints ***************************/
exports.listComplaints = async (userId, userType, ngoId) => {
    if(userType == "ngoadmin"){
        return await Complaint.find({ngoId : ObjectID(ngoId)})
        .populate([
            {
                path: 'userId', select: { firstName: 1, lastName : 1,profileImage: 1}
            },
            {
                path: 'ngoId', select: { ngoName: 1}
            }])
    } else {
        return await Complaint.find({createdBy: ObjectID(userId)})
        .populate([
            {
                path: 'userId', select: { firstName: 1, lastName : 1,profileImage: 1}
            },
            {
                path: 'ngoId', select: { ngoName: 1}
            }])
    }

};

exports.replyComplaint = async (id, complaint) => {
    return await Complaint.findByIdAndUpdate(id, complaint);
};