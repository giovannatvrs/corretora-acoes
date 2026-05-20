const express = require('express');
const authController = require('./src/controllers/authController');
require('dotenv').config();
const protegerRota = require('./src/middleware/authMiddleware');
const app = express();
app.use(express.json());

app.post('/auth/register', authController.register);
app.post('/auth/login', authController.login);
app.post('/auth/recuperar-senha', authController.recuperarSenha);
app.post('/auth/trocar-senha', protegerRota, authController.trocarSenha);
app.post('/auth/logout', protegerRota ,authController.logout);

app.get('/', (req, res) => {
  res.json({ mensagem: 'Backend Node.js rodando com sucesso!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
