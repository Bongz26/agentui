'use strict';
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const DocumentRepository = require('../repositories/DocumentRepository');
const ApplicationService = require('./ApplicationService');
const StorageAdapter = require('../integrations/StorageAdapter');
const AuditService = require('./AuditService');

const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
  'application/pdf',
];

const DOCUMENT_TYPES = {
  id_document: 'Identity Document (ID / Passport)',
  proof_of_address: 'Proof of Address',
  supporting_document: 'Supporting Document',
};

class DocumentService {
  getForApplication(applicationId, requestingUser) {
    ApplicationService.getById(applicationId, requestingUser.id);
    return DocumentRepository.findByApplicationId(applicationId);
  }

  upload({ applicationId, documentType, file, requestingUser }) {
    // Validate document type
    if (!DOCUMENT_TYPES[documentType]) {
      throw Object.assign(new Error(`Invalid document type: ${documentType}`), { status: 400 });
    }

    // Validate mime type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw Object.assign(new Error('Unsupported file type. Please upload JPG, PNG, WebP, HEIC, or PDF.'), { status: 400 });
    }

    // Access check
    ApplicationService.getById(applicationId, requestingUser.id);

    // Remove existing document of same type (replace)
    const existing = DocumentRepository.findByApplicationId(applicationId)
      .filter(d => d.document_type === documentType);
    existing.forEach(d => {
      StorageAdapter.delete(d.storage_path);
      DocumentRepository.delete(d.id);
    });

    // Store file
    const ext = path.extname(file.originalname) || '.bin';
    const filename = `${applicationId}_${documentType}_${Date.now()}${ext}`;
    const storagePath = StorageAdapter.store(filename, file.path);

    const doc = DocumentRepository.create({
      id: uuidv4(),
      applicationId,
      documentType,
      originalFilename: file.originalname,
      storagePath,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      uploadedBy: requestingUser.id,
    });

    AuditService.log({
      userId: requestingUser.id,
      action: 'UPLOAD_DOCUMENT',
      entityType: 'application',
      entityId: applicationId,
      metadata: { documentType, filename: file.originalname },
    });

    return doc;
  }

  download(documentId, requestingUser) {
    const doc = DocumentRepository.findById(documentId);
    if (!doc) throw Object.assign(new Error('Document not found'), { status: 404 });

    // Access check via application
    ApplicationService.getById(doc.application_id, requestingUser.id);

    const buffer = StorageAdapter.retrieve(doc.storage_path);
    return { buffer, mimeType: doc.mime_type, filename: doc.original_filename };
  }

  delete(documentId, requestingUser) {
    const doc = DocumentRepository.findById(documentId);
    if (!doc) throw Object.assign(new Error('Document not found'), { status: 404 });

    ApplicationService.getById(doc.application_id, requestingUser.id);
    StorageAdapter.delete(doc.storage_path);
    DocumentRepository.delete(documentId);

    AuditService.log({
      userId: requestingUser.id,
      action: 'DELETE_DOCUMENT',
      entityType: 'application',
      entityId: doc.application_id,
      metadata: { documentId },
    });
  }

  getDocumentTypes() {
    return DOCUMENT_TYPES;
  }
}

module.exports = new DocumentService();
