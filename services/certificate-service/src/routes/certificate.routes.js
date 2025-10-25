const express = require('express');
const CertificateController = require('../controllers/certificate.controller');

const router = express.Router();

router.post('/', CertificateController.generateCertificate);
router.get('/:id', CertificateController.getCertificate);
router.get('/:id/verify', CertificateController.verifyCertificate);

module.exports = router;
