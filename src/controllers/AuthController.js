const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UsuarioModel = require('../models/UsuarioModel');
const ContaCorrenteModel = require('../models/ContaCorrenteModel');
const CarteiraModel = require('../models/CarteiraModel');
const validador = require('../utils/authValidators'); // Importa utilitário de validação

const AuthController = {
  // Lógica de Cadastro
  register: async (req, res) => {
    const { nome, email, senha, senhaRepetida } = req.body;

    // 1. Validações básicas de presença
    if (!nome || !email || !senha || !senhaRepetida) {
      return res.status(400).json({ error: 'Nome, e-mail, senha e confirmação são obrigatórios.' });
    }

    if (nome.trim().length === 0) {
      return res.status(400).json({ error: 'O nome do usuário não pode ser vazio.' });
    }

    // 2. Validações de formato via utils
    if (!validador.verificaEmailValido(email)) {
      return res.status(400).json({ error: 'O e-mail do usuário não está em um formato adequado.' });
    }

    if (!validador.verificaSenhaValida(senha)) {
      return res.status(400).json({ error: 'A senha deve conter ao menos 8 caracteres, incluindo letras e números.' });
    }

    if (senha !== senhaRepetida) {
      return res.status(400).json({ error: 'A confirmação de senha está diferente da senha.' });
    }

    try {
      const emailTratado = email.trim().toLowerCase();

      const salt = await bcrypt.genSalt(10);
      const senhaCriptografada = await bcrypt.hash(senha, salt);

      const idUsuario = await UsuarioModel.criar(nome, emailTratado, senhaCriptografada);

      // Cria a infraestrutura do investidor
      await ContaCorrenteModel.criarConta(idUsuario, 50000000.00);
      await CarteiraModel.criarCarteira(idUsuario);

      // Sorteio de ações favoritas iniciais
      const todasAcoes = await UsuarioModel.listarTodasAcoes();
      const acoesIniciais = UsuarioModel.sortearAcoes(todasAcoes, 10);
      await UsuarioModel.adicionarAcoesFavoritas(idUsuario, acoesIniciais);

      return res.status(201).json({
        message: 'Usuário cadastrado com sucesso!',
        acoesIniciais,
      });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
      }
      console.error(error);
      return res.status(500).json({ error: 'Erro interno ao cadastrar usuário.' });
    }
  },

  // Lógica de Login
  login: async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    try {
      const emailTratado = email.trim().toLowerCase();
      const usuario = await UsuarioModel.buscarPorEmail(emailTratado);

      // Mensagem genérica por segurança para evitar descoberta de contas válidas
      if (!usuario) {
        return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
      }

      const senhaValida = await bcrypt.compare(senha, usuario.senha);
      if (!senhaValida) {
        return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
      }

      // Gera o Token JWT contendo o ID do Usuário
      const token = jwt.sign(
        { id_usuario: usuario.id_usuario },
        process.env.JWT_SECRET,
        { expiresIn: '2h' }
      );

      return res.json({
        message: 'Login bem-sucedido!',
        token: token,
        usuario: {
          id_usuario: usuario.id_usuario,
          nome: usuario.nome,
          email: usuario.email
        }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno ao tentar fazer login.' });
    }
  },

  // Logout
  logout: async (req, res) => {
    return res.json({ message: 'Logout efetuado com sucesso.' });
  },

  // Recuperar Senha (Simulação sem login)
  recuperarSenha: async (req, res) => {
    try {
      let { email, novaSenha, senhaRepetida } = req.body;

      if (!email || !novaSenha || !senhaRepetida) {
        return res.status(400).json({ error: 'E-mail, nova senha e repetição são obrigatórios.' });
      }

      if (!validador.verificaSenhaValida(novaSenha)) {
        return res.status(400).json({ error: 'A nova senha não atende aos critérios de segurança.' });
      }

      if (novaSenha !== senhaRepetida) {
        return res.status(400).json({ error: 'A confirmação de senha está diferente da nova senha.' });
      }

      const emailTratado = email.trim().toLowerCase();
      const usuario = await UsuarioModel.buscarPorEmail(emailTratado);

      if (!usuario) {
        // Blindagem de segurança: Fingimos que deu certo para evitar descoberta de e-mails válidos
        return res.json({ message: 'Se o e-mail existir, a senha foi redefinida com sucesso!' });
      }

      const salt = await bcrypt.genSalt(10);
      const novaSenhaCriptografada = await bcrypt.hash(novaSenha, salt);

      await UsuarioModel.atualizarSenha(usuario.id_usuario, novaSenhaCriptografada);

      return res.json({ message: 'Se o e-mail existir, a senha foi redefinida com sucesso!' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao recuperar senha.' });
    }
  },

  // Trocar de Senha (Usuário Logado e Autenticado pelo Middleware)
  trocarSenha: async (req, res) => {
    try {
      const id_usuario = req.usuarioId; // Capturado direto do authMiddleware
      const { senhaAtual, novaSenha, novaSenhaRepetida } = req.body;

      if (!senhaAtual || !novaSenha || !novaSenhaRepetida) {
        return res.status(400).json({ error: 'Todos os campos de senha são obrigatórios.' });
      }

      if (!validador.verificaSenhaValida(novaSenha)) {
        return res.status(400).json({ error: 'A nova senha deve conter ao menos 8 caracteres, letras e números.' });
      }

      if (novaSenha !== novaSenhaRepetida) {
        return res.status(400).json({ error: 'A confirmação da nova senha não confere.' });
      }

      const usuario = await UsuarioModel.buscarPorId(id_usuario);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha);
      if (!senhaValida) {
        return res.status(401).json({ error: 'A senha atual digitada está incorreta.' });
      }

      const salt = await bcrypt.genSalt(10);
      const novaSenhaCriptografada = await bcrypt.hash(novaSenha, salt);

      await UsuarioModel.atualizarSenha(id_usuario, novaSenhaCriptografada);

      return res.json({ message: 'Senha alterada com sucesso!' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao trocar a senha.' });
    }
  }
};

module.exports = AuthController;