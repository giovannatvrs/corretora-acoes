const jwt = require('jsonwebtoken');

function gerarToken(idUsuario = 1) {
  return jwt.sign({ id_usuario: idUsuario }, process.env.JWT_SECRET);
}

function headerAutenticado(idUsuario = 1) {
  return { Authorization: `Bearer ${gerarToken(idUsuario)}` };
}

module.exports = { gerarToken, headerAutenticado };
