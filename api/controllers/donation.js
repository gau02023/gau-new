var Donation=require('../models/donation.js');
const ObjectID = require('mongodb').ObjectId;

/******************* Add Donation ***************************/
exports.addDonation = async (donation) => {
    return await Donation.create(donation);
};

/******************* List Documents ***************************/
exports.listDonation = async (userId, userType, ngoId) => {
    if(userType == "ngoadmin"){
        return await Donation.find({ngoId : ObjectID(ngoId)})
        .populate([
            {
                path: 'userId', select: { firstName: 1, lastName : 1,profileImage: 1}
            },
             {
                path: 'ngoId', select: { ngoName: 1}
            }])
    } else {
        return await Donation.find({createdBy: ObjectID(userId)})
        .populate([
            {
                path: 'userId', select: { firstName: 1, lastName : 1,profileImage: 1}
            },
            {
                path: 'ngoId', select: { ngoName: 1}
            }])
    }

};