/* NGO Model */
var NGO = require("../models/ngo.js");
const ObjectID = require('mongodb').ObjectId;

exports.getAllNGO = async () => {
    return await NGO.find({ngoStatus: "active"}, {ngoName: 1});
};
exports.getAllNGOUsers = async (Id) => {
    return await NGO.find({ createdBy: ObjectID(Id) })
};

exports.listAllBranches = async (Id) => {
    return await NGO.find({ createdBy: ObjectID(Id)}, {ngoName: 1, ngoBranches: 1,branchPicture:1,branchContact:1,branchEmail:1,branchPointOfContact:1})
};

exports.getNGOByUser = async (Id) => {
    return await NGO.findOne({ createdBy: ObjectID(Id) })
};

exports.createNGO = async (ngo) => {
    return await NGO.create(ngo);
};
exports.getNGOById = async (id) => {
    return await NGO.findById(id);
};

exports.updateNGO = async (id, ngo) => {
    return await NGO.findByIdAndUpdate(id, ngo);
};

exports.deleteNGO = async (id) => {
    return await NGO.findByIdAndDelete(id);
};