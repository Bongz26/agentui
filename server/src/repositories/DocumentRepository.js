'use strict';
const db = require('../db/database');

class DocumentRepository {
  findByApplicationId(applicationId) {
    return db.all(`
      SELECT d.*, u.first_name || ' ' || u.last_name AS uploaded_by_name
      FROM documents d
      LEFT JOIN users u ON u.id = d.uploaded_by
      WHERE d.application_id = ?
      ORDER BY d.uploaded_at DESC
    `, [applicationId]);
  }

  findById(id) {
    return db.get('SELECT * FROM documents WHERE id = ?', [id]);
  }

  create({ id, applicationId, documentType, originalFilename, storagePath, mimeType, sizeBytes, uploadedBy }) {
    const now = new Date().toISOString();
    db.run(
      `INSERT INTO documents (id, application_id, document_type, original_filename, storage_path, mime_type, size_bytes, uploaded_by, uploaded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, applicationId, documentType, originalFilename, storagePath, mimeType, sizeBytes, uploadedBy, now]
    );
    db.persist();
    return this.findById(id);
  }

  delete(id) {
    db.run('DELETE FROM documents WHERE id = ?', [id]);
    db.persist();
  }
}

module.exports = new DocumentRepository();
