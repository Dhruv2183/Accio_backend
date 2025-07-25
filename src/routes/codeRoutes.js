import express from 'express';
import fs from 'fs-extra';
import archiver from 'archiver';
import path from 'path';

const router = express.Router();

router.post('/download', async (req, res) => {
  const { filename = 'component.js', code = '// Your code here' } = req.body;

  try {
    const tempDir = path.join('temp');
    const filePath = path.join(tempDir, filename);
    const zipPath = path.join(tempDir, 'code.zip');

    await fs.ensureDir(tempDir);

    await fs.writeFile(filePath, code);

    // Create ZIP archive
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      res.download(zipPath, 'code.zip', async () => {
        await fs.remove(tempDir);
      });
    });

    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(output);
    archive.file(filePath, { name: filename });
    archive.finalize();
  } catch (err) {
    console.error('Error zipping file:', err);
    res.status(500).json({ error: 'Failed to create ZIP' });
  }
});

export default router;
