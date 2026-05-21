const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const request = require('supertest');

jest.mock('../src/models/usuarioModel');

const UsuarioModel = require('../src/models/usuarioModel');
const app = require('../src/app');

describe('POST /auth/login', () => {
  const email = 'usuario@teste.com';
  const senha = 'senha123';
  let senhaHash;

  beforeAll(async () => {
    senhaHash = await bcrypt.hash(senha, 10);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 400 quando e-mail ou senha não são enviados', async () => {
    const res = await request(app).post('/auth/login').send({ email });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'E-mail e senha são obrigatórios.' });
    expect(UsuarioModel.buscarPorEmail).not.toHaveBeenCalled();
  });

  it('retorna 401 quando o e-mail não está cadastrado', async () => {
    UsuarioModel.buscarPorEmail.mockResolvedValue(undefined);

    const res = await request(app)
      .post('/auth/login')
      .send({ email, senha });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'E-mail ou senha incorretos.' });
    expect(UsuarioModel.buscarPorEmail).toHaveBeenCalledWith(email);
  });

  it('retorna 401 quando a senha está incorreta', async () => {
    UsuarioModel.buscarPorEmail.mockResolvedValue({
      id_usuario: 1,
      nome: 'Usuário Teste',
      email,
      senha: senhaHash,
    });

    const res = await request(app)
      .post('/auth/login')
      .send({ email, senha: 'senha-errada' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'E-mail ou senha incorretos.' });
  });

  it('retorna 200 com token e dados do usuário quando as credenciais são válidas', async () => {
    const usuario = {
      id_usuario: 1,
      nome: 'Usuário Teste',
      email,
      senha: senhaHash,
    };
    UsuarioModel.buscarPorEmail.mockResolvedValue(usuario);

    const res = await request(app)
      .post('/auth/login')
      .send({ email, senha });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Login bem-sucedido!');
    expect(res.body.usuario).toEqual({
      id_usuario: usuario.id_usuario,
      nome: usuario.nome,
      email: usuario.email,
    });

    const payload = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(payload).toMatchObject({ id_usuario: usuario.id_usuario });
  });

  it('retorna 500 quando ocorre erro interno', async () => {
    UsuarioModel.buscarPorEmail.mockRejectedValue(new Error('Falha no banco'));

    const res = await request(app)
      .post('/auth/login')
      .send({ email, senha });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Erro interno ao tentar fazer login.' });
  });
});
