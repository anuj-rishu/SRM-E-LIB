const File = require("../models/File");
const User = require("../models/User");
const fs = require("fs");
const { handleError } = require("../utils/errorHandler");

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No file uploaded or file type not supported (only PDF allowed)",
      });
    }

    const { semester, subjectCode, subjectName, regulation } = req.body;

    if (!semester || !subjectCode || !subjectName || !regulation) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const regNumber = req.body.regNumber;
    const user = await User.findOne({ regNumber });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const newFile = new File({
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedBy: user._id,
      uploadedByName: user.name,
      semester: parseInt(semester),
      subjectCode,
      subjectName,
      regulation,
    });

    await newFile.save();

    user.points += 20;
    await user.save();

    res.status(201).json({
      success: true,
      file: newFile,
      points: user.points,
      message: "File uploaded successfully and 20 points added to your account",
    });
  } catch (error) {
    handleError(res, error);
  }
};

const getFiles = async (req, res) => {
  try {
    const files = await File.find().sort({ uploadDate: -1 });
    res.json(files);
  } catch (error) {
    handleError(res, error);
  }
};

const downloadFile = async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const regNumber = req.query.regNumber;

    if (!regNumber) {
      return res.status(400).json({ error: "User registration number required" });
    }

    // Find the file
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // Find the user
    const user = await User.findOne({ regNumber });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user has enough points
    if (user.points < 10) {
      return res.status(403).json({
        error: "Not enough points to download this file",
        points: user.points,
        required: 10,
      });
    }

    // Check if file exists
    if (!fs.existsSync(file.path)) {
      return res.status(404).json({ error: "File not found on server" });
    }

    // Deduct points from user
    user.points -= 10;
    await user.save();

    // Increment download count
    file.downloadCount += 1;
    await file.save();

    // Send file
    res.download(file.path, file.originalName);
  } catch (error) {
    handleError(res, error);
  }
};

const getUserPoints = async (req, res) => {
  try {
    const regNumber = req.params.regNumber;
    const user = await User.findOne({ regNumber });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ points: user.points });
  } catch (error) {
    handleError(res, error);
  }
};

// New handler for previewing files without downloading
const previewFile = async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const regNumber = req.query.regNumber;

    if (!regNumber) {
      return res.status(400).json({ error: "User registration number required" });
    }

    // Find the file
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // Find the user
    const user = await User.findOne({ regNumber });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if file exists
    if (!fs.existsSync(file.path)) {
      return res.status(404).json({ error: "File not found on server" });
    }

    // Send file for preview (no points deduction)
    res.sendFile(file.path);
  } catch (error) {
    handleError(res, error);
  }
};

// Toggle favorite status for a file
const toggleFavorite = async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const regNumber = req.query.regNumber;

    if (!regNumber) {
      return res.status(400).json({ error: "User registration number required" });
    }

    // Find the file
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // Find the user
    const user = await User.findOne({ regNumber });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if file is already in favorites
    const favoriteIndex = user.favorites ? user.favorites.indexOf(fileId) : -1;
    
    // Initialize favorites array if it doesn't exist
    if (!user.favorites) {
      user.favorites = [];
    }
    
    if (favoriteIndex === -1) {
      // Add to favorites
      user.favorites.push(fileId);
      await user.save();
      return res.json({ isFavorite: true, message: "Added to favorites" });
    } else {
      // Remove from favorites
      user.favorites.splice(favoriteIndex, 1);
      await user.save();
      return res.json({ isFavorite: false, message: "Removed from favorites" });
    }
  } catch (error) {
    handleError(res, error);
  }
};

// Get user's favorite files
const getFavorites = async (req, res) => {
  try {
    const regNumber = req.query.regNumber;

    if (!regNumber) {
      return res.status(400).json({ error: "User registration number required" });
    }

    // Find the user
    const user = await User.findOne({ regNumber }).populate('favorites');
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // If user has no favorites array yet, initialize it
    if (!user.favorites) {
      user.favorites = [];
      await user.save();
    }

    res.json(user.favorites || []);
  } catch (error) {
    handleError(res, error);
  }
};

// Get popular files (sorted by download count)
const getPopularFiles = async (req, res) => {
  try {
    // Get top 10 files by download count
    const files = await File.find()
      .sort({ downloadCount: -1 })
      .limit(10);
      
    res.json(files);
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  uploadFile,
  getFiles,
  downloadFile,
  getUserPoints,
  previewFile,
  toggleFavorite,
  getFavorites,
  getPopularFiles,
};