var Project=require('../models/project.js');
const ObjectID = require('mongodb').ObjectId;

/******************* Add Project ***************************/
exports.addProject = async (prj) => {
    return await Project.create(prj);
};

/******************* List Projects ***************************/
exports.listProjects = async (ngoId) => {
        return await Project.find({ngoId : ObjectID(ngoId), status : {$in: [
            "active", "inactive"
        ]}})
       
        .populate([
            {
                path: 'createdBy', select: { firstName: 1, lastName : 1,profileImage: 1}
            }])
};

exports.updateProject = async (id, prj) => {
    return await Project.findByIdAndUpdate(id, prj);
};