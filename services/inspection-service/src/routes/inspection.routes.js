const express = require('express');
const InspectionController = require('../controllers/inspection.controller');

const router = express.Router();

router.post('/', InspectionController.startInspection);
router.put('/:id/checkpoint', InspectionController.updateCheckpoint);
router.post('/:id/complete', InspectionController.completeInspection);
router.get('/:id', InspectionController.getInspection);

module.exports = router;
