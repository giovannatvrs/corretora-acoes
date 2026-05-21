const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (req, res, next) => {
  // 1. Busca o cabeçalho de autorização
  const authHeader = req.headers['authorization'];
  
  // Se não enviou o cabeçalho, barra aqui
  if (!authHeader) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }

  const partes = authHeader.split(' ');

  // Valida se a estrutura tem exatamente duas partes e se a primeira é "Bearer"
  if (partes.length !== 2 || partes[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Token mal formatado. Use o padrão Bearer.' });
  }

  const token = partes[1];

  try {
    // 3. Valida o token
    const verificado = jwt.verify(token, process.env.JWT_SECRET);
    req.usuarioLogado = verificado;
    req.usuarioId = verificado.id_usuario;

    next(); 
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido ou expirado.' });
  }
};