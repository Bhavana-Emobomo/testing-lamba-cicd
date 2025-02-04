const db = require("./lib/db");
const {
  generateErrorResponse,
  generateSuccessResponse,
} = require("./lib/response");
const logger = require("./lib/logger");
const decodeToken = require("./lib/decodeToken");

exports.handler = async (event) => {
  try {
    const authHeader =
      event.headers.Authorization || event.headers.authorization;

    if (!authHeader) {
      return generateErrorResponse("Authorization header is missing.", 401);
    }
    logger.logInfo("Event", event);

    const token = authHeader.split(" ")[1];
    if (!token) {
      return generateErrorResponse("Token is missing.", 401);
    }

    const decoded = decodeToken(token);
    if (!decoded || !decoded.UserId || !decoded.companyName) {
      return generateErrorResponse("Invalid or malformed token.", 401);
    }

    const userPK = decoded.UserId;
    const companyName = decoded.companyName;
    const sanitizedCompanyName = companyName
      .replace(/[\s&]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "");
    const tableName = `${sanitizedCompanyName}-Customers`;

    const {
      CompanyName,
      phone,
      email,
      alternativePhone,
      address,
      contactName,
      alternativeEmail,
      contacts = [], // Default to an empty array if not provided
      ...additionalDetails
    } = JSON.parse(event.body || "{}");

    // Validate if either phone or email is provided, and name is mandatory
    if (!contactName) {
      return generateErrorResponse("Contact name is mandatory.", 400);
    }
    if (!phone && !alternativePhone && !alternativeEmail && !email) {
      return generateErrorResponse(
        "Either phone number or email is mandatory.",
        400
      );
    }

    // Step 4: Create the customer in DynamoDB
    const timestamp = Date.now();
    const customerId = `CUS#${timestamp}`;
    const customerData = {
      PK: customerId,
      SK: customerId,
      Name: CompanyName,
      EntityType: "Customer",
      phone,
      email,
      address,
      contactName,
      contacts: contacts.length > 0 ? contacts : undefined, // Only include contacts if provided
      Values: {
        alternativeEmail,
        alternativePhone,
        isDeleted: false,
        ...additionalDetails,
      },
      CreatedBy: userPK, // Use the UserPK for CreatedBy field
      userPK: userPK,
    };

    await db.createCustomer(customerData, tableName);

    return generateSuccessResponse("Customer created successfully.", {
      customerId,
    });
  } catch (error) {
    console.error("Error in create Customer handler:", error);
    return generateErrorResponse(error.message || "Internal Server Error", 500);
  }
};
