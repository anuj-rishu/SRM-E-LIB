const express = require("express");
const { tokenMiddleware } = require("../middleware/authMiddleware");

const { getProfile } = require("../handlers/profileHandler");
const { getUser } = require("../handlers/userHandler");
const { handleError } = require("../utils/errorHandler");

const router = express.Router();

function routeHandler(fn) {
  return async (req, res) => {
    try {
      const data = await fn(req.headers["x-csrf-token"]);
      res.json(data);
    } catch (error) {
      handleError(res, error);
    }
  };
}

router.get("/profile", tokenMiddleware, routeHandler(getProfile));
router.get("/user", tokenMiddleware, routeHandler(getUser));

module.exports = router;
