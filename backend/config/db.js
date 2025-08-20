const mongoose = require("mongoose");
const logger = require("./logger");

const connectDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/elib');
    logger.info('Connected to MongoDB');
  } catch (err) {
    logger.error(`MongoDB connection error: ${err.message}`, { error: err });
    process.exit(1);
  }
};

module.exports = connectDatabase;