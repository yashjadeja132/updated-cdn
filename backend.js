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

app.listen(2009, () => {
	console.log("Server Started on Port 2009");
});

// Configure Multer for all file types
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "./uploads/"); // Store all files in the 'uploads' directory
	},
	filename: function (req, file, cb) {
		const uniqueSuffix = Date.now();
		cb(null, uniqueSuffix + "-" + file.originalname);
	},
});

const upload = multer({ storage: storage });

// Upload any file
app.post("/upload-file", upload.single("file"), async (req, res) => {
	try {
		const fileName = req.file.filename;
		res.json({ status: "ok", data: fileName });
	} catch (error) {
		res.status(500).json({ status: "error", message: error.message });
	}
});

// Upload multiple files
app.post("/upload-files", upload.array("files", 10), async (req, res) => {
	try {
		const fileNames = req.files.map(file => file.filename);
		res.json({ status: "ok", data: fileNames });
	} catch (error) {
		res.status(500).json({ status: "error", message: error.message });
	}
});

// Retrieve any file
app.get("/get-file/:filename", async (req, res) => {
	try {
		const filename = req.params.filename;
		const filePath = path.join("./uploads/", filename);
		if (fs.existsSync(filePath)) {
			const fileBuffer = fs.readFileSync(filePath);
			const mimeType = require("mime-types").lookup(filename) || "application/octet-stream";
			res.set("Content-Type", mimeType);
			res.send(fileBuffer);
		} else {
			res.status(404).json({ status: "error", message: "File not found" });
		}
	} catch (error) {
		res.status(500).json({ status: "error", message: error.message });
	}
});

// Delete any file
app.delete("/delete-file/:filename", async (req, res) => {
	try {
		const filename = req.params.filename;
		const filePath = path.join("./uploads/", filename);

		if (fs.existsSync(filePath)) {
			fs.unlinkSync(filePath);
			res.status(200).json({
				status: "ok",
				message: "File deleted successfully!",
			});
		} else {
			res.status(404).json({ status: "error", message: "File not found" });
		}
	} catch (error) {
		res.status(500).json({ status: "error", message: error.message });
	}
});

// Update (replace) any file
app.put("/update-file/:filename", upload.single("file"), async (req, res) => {
	try {
		const filename = req.params.filename;
		const filePath = path.join("./uploads/", filename);

		if (fs.existsSync(filePath)) {
			fs.unlinkSync(filePath); // Delete the old file
			const uploadedFile = req.file.filename;
			res.status(200).json({
				status: "ok",
				message: "File updated successfully!",
				file: uploadedFile,
			});
		} else {
			res.status(404).json({ status: "error", message: "File not found" });
		}
	} catch (error) {
		res.status(500).json({ status: "error", message: error.message });
	}
});
