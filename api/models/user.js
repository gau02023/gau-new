const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');

const schema = mongoose.Schema;

/* NGO User Verification Schema */

var personalInformation = mongoose.Schema({
    firstName: {
        type: String,
        required: [true, "First Name is required"]
    },
    lastName: {
        type: String,
        required: [true, "Last Name is required"]
    },
    dateOfBirth: {
        type: Date,
        required: [true, "DOB is required"]
    },
    email: {
        type: String,
        required: [true, "Email is required"]
    },
    phoneNo: {
        type: String,
        required: [true, "Phone No is required"]
    },
    country: {
        type: String,
        required: [true, "Country is required"]
    },
    age: {
        type: String,
        required: [true, "Age is required"]
    },
    city: {
        type: String,
        required: [true, "City is required"]
    },
    address: {
        type: String,
        required: [true, "Address is required"]
    },
    demand: {
        type: String,
        required: [true, "Demand is required"]
    },
    tracking: {
        type: String,
        required: [true, "Tracking is required"]
    },
    documentType : {
        type: String,
        enum: ["NationalID", "ResidentialID", "Passport"]
    },
    documentURL: {
        type: String
    }
})


var economicSituation = mongoose.Schema({
    revenue: {
        type: String,
        required: [true, "Revenue is required"]
    },
    expenses: {
        type: String,
        required: [true, "Expenses is required"]
    },
    aidsBonuses: {
        type: String,
        required: [true, "Aids / Bonuses is required"]
    },
    debt: {
        type: String,
        required: [true, "Debt is required"]
    },
    housing: {
        type: String,
        required: [true, "Housing is required"]
    }
})

var healthAspects = mongoose.Schema({
    healthAspects: {
        type: String,
        required: [true, "Disability - Dependencies - Mental Health is required"]
    }
})

var socioFamilySituation = mongoose.Schema({
    socioFamily: {
        type: String,
        required: [true, "Marital Status - Family Composition - Social Network is required"]
    }
})


var studiesTraining = mongoose.Schema({
    educationLevel: {
        type: String,
        required: [true, "Education Level is required"]
    },
    specialization: {
        type: String,
        required: [true, "Specialization is required"]
    },
    complementaryTraining: {
        type: String,
        required: [true, "Complementary Training is required"]
    },
    completionYear: {
        type: String,
        required: [true, "Completion Year is required"]
    },
})


var professionalReferences = mongoose.Schema({
    fullName: {
        type: String,
        required: [true, "Name is required"]
    },
    email: {
        type: String,
        required: [true, "Email is required"]
    },
    phone: {
        type: String,
        required: [true, "Phone is required"]
    },
    center: {
        type: String,
        required: [true, "Center is required"]
    },
    relation: {
        type: String,
        required: [true, "Relation is required"]
    },
})

var discriminationVoilence = mongoose.Schema({
    typeId: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Lookup',
        required: [true, "Type is required"]
    },
    discriminationVoilenceValue : {
        type: String,
        required: [true, "Discrimination Voilence is required"]
    }
})

var workExperience = mongoose.Schema({
    position: {
        type: String,
        required: [true, "Position is required"]
    },
    contract: {
        type: String,
        required: [true, "Contract is required"]
    },
    enterprise: {
        type: String,
        required: [true, "Enterprise is required"]
    },
    duration: {
        type: String,
        required: [true, "Duration is required"]
    },
    noOfYears: {
        type: String,
        required: [true, "Work Experience is required"]
    },
    startDate: {
        type: Date,
        required: [true, "Start Date is required"]
    },
    endDate: {
        type: Date,
        required: [true, "End Date is required"]
    },
})

var userConsentForm = mongoose.Schema({
    personalInformation: personalInformation,
    economicSituation: economicSituation,
    healthAspects: healthAspects,
    socioFamilySituation: socioFamilySituation,
    studiesTraining: [studiesTraining],
    professionalReferences: [professionalReferences],
    discriminationVoilence: discriminationVoilence,
    workExperience: [workExperience],
    consentSignatures: {
        type: String,
        requried: [true, "Consent Signature is required"]
    },
    agreementSignatures: {
        type: String,
        requried: [true, "Agreement Signature is required"]
    },
    userImage: {
        type: String,
        default: "https://testing-buck-22.s3.amazonaws.com/User-Profile-PNG-Download-Image.png"
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Users',
    }
})

/* Over 18 User */

var over18Form = mongoose.Schema({
    over18Number: {
        type: String
    },
    over18Age: {
        type: String
    },
    over18Sex: {
        type: String
    },
    over18MaritalStatus: {
        type: String
    },
    over18Profession: {
        type: Date
    },
    over18Studies: {
        type: String
    },
    over18Address: {
        type: String
    },
    over18Origin: {
        type: String
    },
    over18Telephone: {
        type: String
    },
    over18Couple: {
        type: String
    },
    over18Children: {
        type: String
    },
    over18Informant: {
        type: String
    },
    over18PriorPsychologicalCare: {
        type: String
    },
    over18ReasonForConsultation: {
        type: String
    },
    over18StartDate: {
        type: Date
    },
    over18Duration: {
        type: Number
    },
    over18PrecipitatingFactors: {
        type: String
    },
    over18ImpactOfProblem: {
        type: String
    },
    over18Objective: {
        type: String
    },
    over18PreviousDevelopment: {
        type: String
    },
    over18Environment: {
        type: String
    },
    over18Habits: {
        type: String
    },
    over18Antental: {
        type: String
    },
    over18PreviousDevelopmentChildhood: {
        type: String
    },
    over18StudiesEnvironment: {
        type: String
    },
    over18StudiesHabits: {
        type: String
    },
    over18StudiesProfessionalAspirations: {
        type: String
    },
    over18StudiesPreviousWorks: {
        type: String
    },
    over18MotherName: {
        type: String
    },
    over18MotherProfession: {
        type: String
    },
    over18MotherAge: {
        type: String
    },
    over18FatherName: {
        type: String
    },
    over18FatherProfession: {
        type: String
    },
    over18FatherAge: {
        type: String
    },
    over18Siblings: {
        type: String
    },
    over18CoupleName: {
        type: String
    },
    over18CoupleProfession: {
        type: String
    },
    over18CoupleAge: {
        type: String
    },
    over18ChildrenName: {
        type: String
    },
    over18ChildrenAge: {
        type: String
    },
    over18MotherRelation: {
        type: String
    },
    over18FatherRelation: {
        type: String
    },
    over18BrotherRelation: {
        type: String
    },
    over18PartnerRelation: {
        type: String
    },
    over18ChildRelation: {
        type: String
    },
    over18RelevantFamilyProblems: {
        type: String
    },
    over18Frequency: {
        type: String
    },
    over18Ease: {
        type: String
    },
    over18Difficulties: {
        type: String
    },
    over18CurrentDisturbance: {
        type: String
    },
    over18AnyOneHelp: {
        type: String
    },
    over18TakesMostTime: {
        type: String
    },
    over18HowFun: {
        type: String
    },
    over18ComfortableSituations: {
        type: String
    },
    over18ImportantPerson: {
        type: String
    },
    over18ImportantConcerns: {
        type: String
    },
    over18ChangeThings: {
        type: String
    },
    over18ExpectFromOthers: {
        type: String
    },
    over18GreatestIllusion: {
        type: String
    },
    over18CurrentRelationship: {
        type: String
    },
    over18SpecificProblems: {
        type: String
    },
    over18GenitalProblems: {
        type: String
    },
    over18AreasofCompatibility: {
        type: String
    },
    over18AreasofIncompatibility: {
        type: String
    },
    over18CommunicationLevel: {
        type: String
    },
    over18PreviousIntercourse: {
        type: String
    },
    over18ExtraMaritalAffairs: {
        type: String
    },
    over18NotAbleToGetHead: {
        type: String
    },
    over18AbsurdUnpleasant: {
        type: String
    },
    over18FeelNervous: {
        type: String
    },
    over18AvoidThoughts: {
        type: String
    },
    over18TaskRepeat: {
        type: String
    },
    over18MajorIllness: {
        type: String
    },
    over18Diseases: {
        type: String
    },
    over18Illness: {
        type: String
    },
    over18PhysicalDiscomfort: {
        type: String
    },
    over18RelevantMedication: {
        type: String
    },
    over18PhysicalDescription: {
        type: String
    },
    over18BehaviourObservation: {
        type: String
    },
    addedByUser: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Users',
    }
})

/* Over 18 User End*/

/* Under 18 User */

var under18Form = mongoose.Schema({
    under18Number: {
        type: String
    },
    under18Age: {
        type: String
    },
    under18Sex: {
        type: String
    },
    under18SchoolCourse: {
        type: String
    },
    under18LiveWith: {
        type: Date
    },
    under18Informant: {
        type: String
    },
    under18PriorPsychologicalCare: {
        type: String
    },
    under18ParentalNumber: {
        type: String
    },
    under18ParentalAge: {
        type: String
    },
    under18ParentalProfession: {
        type: String
    },
    under18ParentalDisease: {
        type: String
    },
    under18SiblingsNumber: {
        type: String
    },
    under18SiblingsAge: {
        type: String
    },
    under18SiblingsProfession: {
        type: String
    },
    under18SiblingsDisease: {
        type: String
    },
    under18ReasonForConsultation: {
        type: String
    },
    under18StartDate: {
        type: Date
    },
    under18Duration: {
        type: Number
    },
    under18PrecipitatingFactors: {
        type: String
    },
    under18ImpactOfProblem: {
        type: String
    },
    under18Objective: {
        type: String
    },
    under18PreviousDevelopment: {
        type: String
    },
    under18Environment: {
        type: String
    },
    under18Habits: {
        type: String
    },
    under18EducationLevel: {
        type: String
    },
    under18RelationClassMates: {
        type: String
    },
    under18RelationshipTeachers: {
        type: String
    },
    under18SchoolProblems: {
        type: String
    },
    under18CareerAspirations: {
        type: String
    },
    under18ExtraCiricularActivities: {
        type: String
    },
    under18AttitudeExams: {
        type: String
    },    
    under18ParentsAttitude: {
        type: String
    },
    under18MotherName: {
        type: String
    },
    under18FatherName: {
        type: String
    },
    under18Siblings: {
        type: String
    },
    under18DependencyLevel: {
        type: String
    },
    under18RelevantFamilyProblems: {
        type: String
    },
    under18TimeDedicated: {
        type: String
    },
    under18RelationshipBetweenParents: {
        type: String
    },
    under18ImportantEvents: {
        type: String
    },
    under18ApplicationOfReward: {
        type: String
    },
    under18Friends: {
        type: String
    },
    under18Interact: {
        type: String
    },
    under18Difficulties: {
        type: String
    },
    under18TakesMostTime: {
        type: String
    },
    under18HowFun: {
        type: String
    },
    under18ComfortableSituations: {
        type: String
    },
    under18ImportantPerson: {
        type: String
    },
    under18ImportantConcerns: {
        type: String
    },
    under18ChangeThings: {
        type: String
    },
    under18SexualGames: {
        type: String
    },
    under18SexualCurosity: {
        type: String
    },
    under18LevelOfSexEducation: {
        type: String
    },
    under18SexualDevelopment: {
        type: String
    },
    under18NotAbleToGetHead: {
        type: String
    },
    under18AbsurdUnpleasant: {
        type: String
    },
    under18FeelNervous: {
        type: String
    },
    under18AvoidThoughts: {
        type: String
    },
    under18TaskRepeat: {
        type: String
    },
    under18MajorIllness: {
        type: String
    },
    under18Diseases: {
        type: String
    },
    under18Illness: {
        type: String
    },
    under18PhysicalDiscomfort: {
        type: String
    },
    under18RelevantMedication: {
        type: String
    },
    under18PhysicalDescription: {
        type: String
    },
    under18BehaviourObservation: {
        type: String
    },
    addedByUser: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Users',
    }
})



/* Under 18 User End */


// Users Schema
const usersSchema = new schema({
    firstName: {
        type: String,
        required: [true, "First Name is required"]
    },
    lastName: {
        type: String,
        required: [true, "Last Name is required"]
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: [true, "Email Already Exists"],
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    phoneNumber: {
        type: String,
        required: [true, "Phone Number is required"]
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minLength: 5,
        maxLength: 500
    },
    profileImage: {
        type: String,
        default: "https://testing-buck-22.s3.amazonaws.com/User-Profile-PNG-Download-Image.png"
    },
    IDDetails: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Users',
    },
    userStatus: {
        type: String,
        enum: ['pending', 'active', 'inactive', 'deleted'],
        default: 'active'
    },
    verificationStatus: {
        type: String,
        enum: ['unverified', 'verified'],
        default: 'verified'
    },
    userType: {
        type: String,
        enum: ['superadmin', 'ngoadmin', 'socialWorker', 'psychologist', 'lawyer', 'user'],
        default: 'superadmin'
    },
    ngoId: {
        type: mongoose.Schema.Types.ObjectId, ref: 'NGO',
    },
    appointmentId:{
        type: String,
        type: mongoose.Schema.Types.ObjectId, ref: 'Appointment'
    },
    OTP: {
        type: String
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    userConsentForm: userConsentForm,
    over18Form: over18Form,
    under18Form: under18Form
})

usersSchema.methods.hashPassword = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10))
}
usersSchema.methods.comparePassword = function (password, hash) {
    return bcrypt.compareSync(password, hash)
}

const users = module.exports = mongoose.model('Users', usersSchema);