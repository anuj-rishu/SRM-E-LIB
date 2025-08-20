const express = require("express");
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const fileRoutes = require("./fileRoutes");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Hello, World!" });
});

router.use(authRoutes);
router.use(userRoutes);
router.use(fileRoutes);

module.exports = router;