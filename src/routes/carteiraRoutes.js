const express = require('express');
const router = express.Router();
const CarteiraController = require('../controllers/CarteiraController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, CarteiraController.listarCarteira);

module.exports = router;
