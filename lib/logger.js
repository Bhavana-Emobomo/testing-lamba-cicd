function logError(message, details) {
  console.error(JSON.stringify({ level: "ERROR", message, details }));
}

function logInfo(message, details) {
  console.log(JSON.stringify({ level: "INFO", message, details }));
}

module.exports = { logError, logInfo };
