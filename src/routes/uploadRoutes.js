import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';
import mammoth from 'mammoth';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const router = express.Router();

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});
const upload = multer({ storage });

// Optional mock Whisper function
async function transcribeAudio(filePath) {
  // In production, replace this with real transcription
  return `Transcription of audio from: ${path.basename(filePath)}`;
}

router.post('/', upload.array('files'), async (req, res) => {
  try {
    const fileInfos = await Promise.all(
      req.files.map(async (file) => {
        const ext = path.extname(file.originalname).toLowerCase();
        let parsedText = null;

        if (file.mimetype === 'application/pdf') {
          const dataBuffer = fs.readFileSync(file.path);
          const parsed = await pdfParse(dataBuffer);
          parsedText = parsed.text;
        }

        else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          const result = await mammoth.extractRawText({ path: file.path });
          parsedText = result.value;
        }

        else if (file.mimetype === 'text/plain') {
          parsedText = fs.readFileSync(file.path, 'utf-8');
        }

        else if (file.mimetype.startsWith('image/')) {
          parsedText = null; // No parsing, just preview
        }

        else if (file.mimetype.startsWith('video/')) {
  try {
    const transcript = await transcribeAudioFromVideo(file.path);
    parsedText = transcript;
  } catch (err) {
    console.error('Whisper transcription failed:', err.message);
    parsedText = '⚠️ Audio transcription failed.';
  }
}

        return {
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          url: `/uploads/${file.filename}`,
          content: parsedText,
        };
      })
    );

    res.status(200).json({
      message: 'Files uploaded and parsed successfully',
      files: fileInfos,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed', error });
  }
});

export default router;
