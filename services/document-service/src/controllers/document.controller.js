const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const Document = require('../models/document.model');
const { kafkaService } = require('../config/kafka');

class DocumentController {
  static async scanDocument(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const { userId, documentType = 'carte_grise' } = req.body;

      // Save document record
      const document = new Document({
        userId,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        filePath: req.file.path,
        documentType,
        status: 'processing'
      });

      await document.save();

      // Process image asynchronously
      DocumentController.processOCR(document._id).catch(console.error);

      res.status(202).json({
        success: true,
        message: 'Document uploaded and processing started',
        data: {
          documentId: document._id,
          status: document.status
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async processOCR(documentId) {
    try {
      const document = await Document.findById(documentId);
      if (!document) return;

      // Preprocess image
      const processedImagePath = document.filePath + '.processed.png';
      await sharp(document.filePath)
        .greyscale()
        .normalize()
        .sharpen()
        .toFile(processedImagePath);

      // Perform OCR
      const { data: { text, confidence } } = await Tesseract.recognize(
        processedImagePath,
        'eng+fra',
        { logger: m => console.log(m) }
      );

      // Extract structured data (simplified example)
      const extractedData = DocumentController.parseCarteGrise(text);

      // Update document
      document.status = 'processed';
      document.ocrText = text;
      document.confidence = confidence / 100;
      document.extractedData = extractedData;
      document.processedAt = new Date();
      await document.save();

      // Publish event
      const kafka = kafkaService();
      await kafka.publishEvent('documents-topic', 'document.processed', {
        documentId: document._id.toString(),
        userId: document.userId,
        extractedData,
        confidence: document.confidence,
        processedAt: document.processedAt
      });

      console.log(`Document ${documentId} processed successfully`);
    } catch (error) {
      console.error('OCR processing error:', error);
      await Document.findByIdAndUpdate(documentId, { 
        status: 'failed',
        processedAt: new Date()
      });
    }
  }

  static parseCarteGrise(text) {
    const data = {};
    
    // Extract registration number
    const regMatch = text.match(/([A-Z]{2}[-\s]?\d{3}[-\s]?[A-Z]{2})/i);
    if (regMatch) data.registrationNumber = regMatch[1].replace(/[-\s]/g, '');

    // Extract VIN
    const vinMatch = text.match(/\b([A-HJ-NPR-Z0-9]{17})\b/i);
    if (vinMatch) data.vin = vinMatch[1];

    // Extract make and model (simplified)
    const makeMatch = text.match(/(RENAULT|PEUGEOT|CITROEN|BMW|MERCEDES|VOLKSWAGEN|AUDI|TOYOTA|HONDA)/i);
    if (makeMatch) data.make = makeMatch[1];

    // Extract year
    const yearMatch = text.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) data.year = parseInt(yearMatch[0]);

    return data;
  }

  static async getDocument(req, res, next) {
    try {
      const { id } = req.params;
      const document = await Document.findById(id);

      if (!document) {
        return res.status(404).json({ success: false, message: 'Document not found' });
      }

      res.json({
        success: true,
        data: {
          id: document._id,
          userId: document.userId,
          fileName: document.fileName,
          documentType: document.documentType,
          status: document.status,
          extractedData: document.extractedData,
          confidence: document.confidence,
          processedAt: document.processedAt,
          createdAt: document.createdAt
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async validateDocument(req, res, next) {
    try {
      const { id } = req.params;
      const { corrections } = req.body;

      const document = await Document.findById(id);
      if (!document) {
        return res.status(404).json({ success: false, message: 'Document not found' });
      }

      // Apply corrections
      if (corrections) {
        document.extractedData = { ...document.extractedData, ...corrections };
        await document.save();
      }

      // Publish validation event
      const kafka = kafkaService();
      await kafka.publishEvent('documents-topic', 'document.validated', {
        documentId: document._id.toString(),
        userId: document.userId,
        extractedData: document.extractedData
      });

      res.json({
        success: true,
        message: 'Document validated successfully',
        data: document.extractedData
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = DocumentController;
