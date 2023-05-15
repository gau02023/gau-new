module.exports.missingParams = async function (inputs, params) {

  let response = {
    missingParam: "Missing or Invalid parameter:",
    status: false
  }
  for (let i = 0; i < params.length; i++) {
    if (!inputs.hasOwnProperty(params[i])) {
      response.missingParam += ` "${params[i]}"`;
      response.status = true;
    }
  }
  return response;
};

module.exports.randomString = async function (length, chars) {
  var result = '';
  for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
  return result;
}