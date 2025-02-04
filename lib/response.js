function generateSuccessResponse(
  message,
  data = {},
  statusCode = 200,
  success = true
) {
  return {
    statusCode: statusCode,
    body: JSON.stringify({
      success: success, // Set to true for success responses
      message: message,
      data: data, // Include any additional data in the response
    }),
  };
}

function generateErrorResponse(message, statusCode, success = false) {
  return {
    statusCode: statusCode,
    body: JSON.stringify({
      success: success, // Add a success field to indicate failure (default is false)
      message: message,
      error: message, // Error message in the body for easier debugging
    }),
  };
}

module.exports = { generateErrorResponse, generateSuccessResponse };
