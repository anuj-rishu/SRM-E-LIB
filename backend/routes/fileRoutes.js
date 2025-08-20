const express = require("express");
const router = express.Router();
const { tokenMiddleware } = require("../middleware/authMiddleware");
const upload = require("../utils/fileUpload");
const { 
  uploadFile, 
  getFiles, 
  downloadFile, 
  getUserPoints, 
  previewFile,
  toggleFavorite,
  getFavorites,
  getPopularFiles
} = require("../handlers/fileHandler");

// Remove any imports of cacheMiddleware
// const { cache, clearCache } = require("../middleware/cacheMiddleware");

router.post(
  "/upload",
  tokenMiddleware,
  upload.single("file"),
  // Remove clearCache if it was used here
  uploadFile
);

// Remove cache middleware from all routes
router.get("/files", tokenMiddleware, getFiles);
router.get("/download/:fileId", tokenMiddleware, downloadFile);
router.get("/points/:regNumber", tokenMiddleware, getUserPoints);
router.get("/preview/:fileId", tokenMiddleware, previewFile);
router.post("/favorites/:fileId", tokenMiddleware, toggleFavorite);
router.get("/favorites", tokenMiddleware, getFavorites);
router.get("/files/popular", tokenMiddleware, getPopularFiles);

module.exports = router;