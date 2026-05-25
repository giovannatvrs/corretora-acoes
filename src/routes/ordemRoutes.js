const express = require('express');
const router = express.Router();
const OrdemController = require('../controllers/OrdemController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/comprar-acao', authMiddleware, OrdemController.comprarAcao);
router.post('/vender-acao', authMiddleware, OrdemController.venderAcao);
router.get('/lista-ordens', authMiddleware, OrdemController.listarOrdensUsuario);
router.patch('/cancelar/:idOrdem', authMiddleware, OrdemController.cancelarOrdemPendente);

module.exports = router;