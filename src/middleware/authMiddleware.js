const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  // Verifica se o header foi enviado
  if (!authHeader) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }

  // O formato esperado é "Bearer TOKEN_AQUI"
  const partes = authHeader.split(' ');
  if (partes.length !== 2 || partes[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Erro no formato do token.' });
  }

  const token = partes[1];

  try {
    // Decodifica o Token usando a sua chave secreta
    const decodificado = jwt.verify(token, process.env.JWT_SECRET);
    
    // Injeta o ID na requisição para que os controllers saibam quem está logado
    req.usuarioId = decodificado.id_usuario; 
    
    return next(); // Passa o bastão para o Controller
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};

module.exports = authMiddleware;