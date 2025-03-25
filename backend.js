const express = require("express");
const app = express();
app.use(express.json());
const cors = require("cors");
app.use(cors());
const fs = require("fs");
const path = require("path");
const multer = require("multer");

app.get("/", async (req, res) => {
    res.send("Success!!!!!!");
});

app.use("/cdn", express.static(path.join(__dirname, "uploads")));

app.listen(2009, () => {
    console.log("Server Started on Port 2009");
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const folderName = req.params.folder;

        if (!folderName || folderName.trim() === "") {
            return cb(new Error("Folder name is required."));
        }

        const folderPath = path.join(__dirname, "uploads", folderName);
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }
        cb(null, folderPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now();
        cb(null, uniqueSuffix + "-" + file.originalname);
    },
});

const upload = multer({ storage: storage });

// Upload a file to a specific folder
app.post("/:folder/upload-file", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: "error", message: "No file uploaded." });
        }

        const folder = req.params.folder;
        const fileName = req.file.filename;
        res.json({ status: "ok", folder: folder, file: fileName, url: `/cdn/${folder}/${fileName}` });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

// Upload multiple files to a specific folder
app.post("/:folder/upload-files", upload.array("files", 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ status: "error", message: "No files uploaded." });
        }

        const folder = req.params.folder;
        const fileNames = req.files.map(file => file.filename);
        const fileUrls = fileNames.map(file => `/cdn/${folder}/${file}`);
        res.json({ status: "ok", folder: folder, files: fileNames, urls: fileUrls });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

// Update (Replace) a file in a specific folder
app.put("/:folder/update-file/:filename", upload.single("file"), async (req, res) => {
    try {
        const { folder, filename } = req.params;

        if (!folder || !filename) {
            return res.status(400).json({ status: "error", message: "Folder name and filename are required." });
        }

        const filePath = path.join(__dirname, "uploads", folder, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ status: "error", message: "File not found." });
        }

        if (!req.file) {
            return res.status(400).json({ status: "error", message: "No file uploaded." });
        }

        // Replace the old file with the new file
        fs.unlinkSync(filePath);
        fs.renameSync(req.file.path, filePath);

        res.json({ status: "ok", message: "File updated successfully!", url: `/cdn/${folder}/${filename}` });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

// Delete a file from a specific folder
app.delete("/:folder/delete-file/:filename", async (req, res) => {
    try {
        const { folder, filename } = req.params;

        if (!folder || !filename) {
            return res.status(400).json({ status: "error", message: "Folder name and filename are required." });
        }

        const filePath = path.join(__dirname, "uploads", folder, filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.status(200).json({ status: "ok", message: "File deleted successfully!" });
        } else {
            res.status(404).json({ status: "error", message: "File not found" });
        }
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

// Delete an entire folder
app.delete("/:folder/delete-folder", async (req, res) => {
    try {
        const { folder } = req.params;

        if (!folder) {
            return res.status(400).json({ status: "error", message: "Folder name is required." });
        }

        const folderPath = path.join(__dirname, "uploads", folder);
        if (fs.existsSync(folderPath)) {
            fs.rmSync(folderPath, { recursive: true, force: true });
            res.status(200).json({ status: "ok", message: "Folder deleted successfully!" });
        } else {
            res.status(404).json({ status: "error", message: "Folder not found" });
        }
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});
