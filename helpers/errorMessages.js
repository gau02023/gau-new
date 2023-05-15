module.exports.ValidationErrors = function (error) {
  let errors = {};

  Object.keys(error.errors).forEach((key) => {
    errors[key] = error.errors[key].message;
  });
  return errors;
}

module.exports.customValidationMessage = function (errors) {
  let errMsg;
  if (errors.code == 11000) {
    errMsg = Object.keys(errors.keyValue)[0] + " already exists.";
  } else {
    errMsg = errors.message;
  }
  return errMsg;
}