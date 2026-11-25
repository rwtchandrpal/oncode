const validator = require("validator");
const { AppError } = require("./AppError");

const validate = (data) => {
  const allowedFields = ["firstName", "lastName", "email", "password", "role"];
  const receivedFields = Object.keys(data);

  // Prevent Mass Assignment
  const hasUnknownFields = receivedFields.some(
    (field) => !allowedFields.includes(field),
  );
  if (hasUnknownFields) {
    throw new AppError(400, "Invalid properties provided in the request.", "VALIDATION_ERROR");
  }

  // Check Missing Fields
  const mandatoryField = ["firstName", "email", "password"];
  const isMissingMandatory = mandatoryField.some(
    (field) => !receivedFields.includes(field),
  );
  if (isMissingMandatory) {
    throw new AppError(400, "Missing required fields: firstName, email, password.", "VALIDATION_ERROR");
  }

  // Type Checking & Cleaning (The Fixes!)
  // Check if it's a string first
  if (typeof data.firstName !== 'string') {
    throw new AppError(400, "First name must be text.", "VALIDATION_ERROR");
  }
  
 
  data.firstName = validator.trim(data.firstName);
  if (!validator.isLength(data.firstName, { min: 1, max: 50 })) {
    throw new AppError(400, "First name must be between 1 and 50 characters long.", "VALIDATION_ERROR");
  }

  if (typeof data.email !== 'string') {
     throw new AppError(400, "Email must be text.", "VALIDATION_ERROR");
  }
  data.email = validator.trim(data.email);
  if (!validator.isEmail(data.email)) {
    throw new AppError(400, "Please provide a valid email address.", "VALIDATION_ERROR");
  }

  // Validate Password 
  if (typeof data.password !== 'string') {
      throw new AppError(400, "Password must be text.", "VALIDATION_ERROR");
  }
  const isStrong = validator.isStrongPassword(data.password, {
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  });

  if (!isStrong) {
    throw new AppError(400, "Password must be at least 8 characters long and contain an uppercase letter, a lowercase letter, a number, and a special character.", "VALIDATION_ERROR");
  }

  // Validate lastName if it was provided
  if (data.lastName) {
    if (typeof data.lastName !== 'string') {
        throw new AppError(400, "Last name must be text.", "VALIDATION_ERROR");
    }
    data.lastName = validator.trim(data.lastName);
    if (!validator.isLength(data.lastName, { min: 1, max: 50 })) {
      throw new AppError(400, "Last name must be between 1 and 50 characters long.", "VALIDATION_ERROR");
    }
  }
};

module.exports = validate;