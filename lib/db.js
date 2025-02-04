const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

const dynamoDBClient = new DynamoDBClient({
  region: "ap-south-1",
});

const docClient = DynamoDBDocumentClient.from(dynamoDBClient);

async function createCustomer(item, tableName) {
  const params = {
    TableName: tableName,
    Item: item,
  };

  try {
    await docClient.send(new PutCommand(params));
    return { success: true, message: "Customer inserted successfully." };
  } catch (error) {
    console.error("Error inserting item into DynamoDB:", error);
    throw new Error("Failed to insert item into DynamoDB.");
  }
}

module.exports = { createCustomer };
