'use strict';
const fs = require('fs');
const path = require('path');

/**
 * StorageAdapter — Local filesystem implementation (prototype).
 * 
 * Production: swap this with S3StorageAdapter or GCSStorageAdapter
 * implementing the same interface:
 *   - store(key, buffer, mimeType) → storagePath
 *   - retrieve(storagePath) → { buffer, mimeType }
 *   - delete(storagePath) → void
 */
class LocalStorageAdapter {
  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || './uploads';
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  store(filename, sourcePath) {
    // Move multer temp file to permanent location
    const dest = path.join(this.uploadDir, filename);
    fs.renameSync(sourcePath, dest);
    return dest;
  }

  storeBuffer(filename, buffer) {
    const dest = path.join(this.uploadDir, filename);
    fs.writeFileSync(dest, buffer);
    return dest;
  }

  retrieve(storagePath) {
    if (!fs.existsSync(storagePath)) {
      throw Object.assign(new Error('Document not found'), { status: 404 });
    }
    return fs.readFileSync(storagePath);
  }

  delete(storagePath) {
    try {
      if (fs.existsSync(storagePath)) fs.unlinkSync(storagePath);
    } catch (err) {
      console.error('[STORAGE] Delete failed:', err.message);
    }
  }
}

// TODO: Replace with S3StorageAdapter when ready
// class S3StorageAdapter {
//   async store(key, buffer) { ... }
//   async retrieve(key) { ... }
//   async delete(key) { ... }
// }

module.exports = new LocalStorageAdapter();
