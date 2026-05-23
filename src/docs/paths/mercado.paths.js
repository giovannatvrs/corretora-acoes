/**
 * @openapi
 * tags:
 *   - name: Mercado
 *     description: Relógio de negociação e cotações
 *
 * /mercado/PegaTempo:
 *   get:
 *     tags: [Mercado]
 *     summary: Retorna hora atual da sessão
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 horaNegociacao:
 *                   type: string
 *                   example: '14:00'
 *
 * /mercado/AvancaTempo:
 *   post:
 *     tags: [Mercado]
 *     summary: Avança o relógio e processa ordens programadas
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AvancaTempoRequest'
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AvancaTempoResponse'
 *       400:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /mercado/ListaAcoesInteresse:
 *   get:
 *     tags: [Mercado]
 *     summary: Lista ações favoritas com preços do minuto atual
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ListaAcoesInteresseResponse'
 *
 * /mercado/AdicionaAcaoInteresse:
 *   post:
 *     tags: [Mercado]
 *     summary: Adiciona ação à lista de interesse
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CodigoAcaoRequest'
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ListaAcoesInteresseResponse'
 *
 * /mercado/RemoveAcaoInteresse:
 *   delete:
 *     tags: [Mercado]
 *     summary: Remove ação da lista de interesse
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CodigoAcaoRequest'
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ListaAcoesInteresseResponse'
 *
 * /mercado/acoes-disponiveis:
 *   get:
 *     tags: [Mercado]
 *     summary: Ações ainda não favoritadas pelo usuário
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AcaoDisponivel'
 *
 * /mercado/acoes/{codigo}:
 *   get:
 *     tags: [Mercado]
 *     summary: Preço atual de uma ação (modal de compra)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *           example: PETR4
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExibirAcaoResponse'
 */

module.exports = {};
