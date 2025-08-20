const { getUserWithPhoto } = require("../helpers/userHelper");
const User = require("../models/User");
const logger = require("../config/logger");

async function getUser(token) {
  const userData = await getUserWithPhoto(token);

  if (userData && userData.regNumber) {
    let user = await User.findOne({ regNumber: userData.regNumber });

    if (!user) {
      user = new User({
        ...userData,
        points: 100,
      });
      await user.save();
      logger.info(`Created new user: ${userData.regNumber} with 100 points`);
    } else {
      user.lastLogin = new Date();
      user.name = userData.name || user.name;
      user.photoBase64 = userData.photoBase64 || user.photoBase64;
      user.program = userData.program || user.program;
      user.semester = userData.semester || user.semester;
      user.department = userData.department || user.department;
      user.section = userData.section || user.section;
      user.mobile = userData.mobile || user.mobile;
      user.year = userData.year || user.year;

      if (userData.advisors && userData.advisors.length) {
        user.advisors = userData.advisors;
      }

      await user.save();
      logger.info(`Updated user: ${userData.regNumber}`);
    }

    userData.points = user.points;
    userData.mongoId = user._id;
  }

  return userData;
}

module.exports = { getUser };