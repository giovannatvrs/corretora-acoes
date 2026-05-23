function verificaEmailValido(email) {
  if (!email) return false;
  return /^[A-Za-z0-9._%-]+@([A-Za-z0-9-].)+[A-Za-z]{2,4}$/.test(email);
}

function verificaSenhaValida(senha) {
  if (!senha) return false;
  if (senha.length < 8) return false;
  return /.*[a-zA-Z].*$/.test(senha) && /.*[0-9].*$/.test(senha);
}

function validarEmail(email) {
  if (email === undefined || email === null || String(email).trim() === '') {
    return { valido: false, erro: 'E-mail é obrigatório.' };
  }

  const valor = String(email).trim().toLowerCase();

  if (!verificaEmailValido(valor)) {
    return { valido: false, erro: 'O e-mail do usuário não está em um formato adequado.' };
  }

  return { valido: true, valor };
}

function validarSenha(senha) {
  if (senha === undefined || senha === null || senha === '') {
    return { valido: false, erro: 'Senha é obrigatória.' };
  }

  if (!verificaSenhaValida(senha)) {
    return {
      valido: false,
      erro: 'A senha deve conter ao menos 8 caracteres, incluindo letras e números.',
    };
  }

  return { valido: true, valor: senha };
}

module.exports = {
  verificaEmailValido,
  verificaSenhaValida,
  validarEmail,
  validarSenha,
};
