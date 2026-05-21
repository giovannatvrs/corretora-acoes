const request = require('supertest');

jest.mock('../src/models/usuarioModel');

const UsuarioModel = require('../src/models/usuarioModel');
const app = require('../src/app');

const acoesNoBanco = Array.from({ length: 15 }, (_, i) => `ACAO${i}`);

describe('POST /auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    UsuarioModel.criar.mockResolvedValue(1);
    UsuarioModel.listarTodasAcoes.mockResolvedValue(acoesNoBanco);
    UsuarioModel.adicionarAcoesFavoritas.mockResolvedValue(undefined);
    UsuarioModel.sortearAcoes.mockImplementation(
      jest.requireActual('../src/models/usuarioModel').sortearAcoes
    );
  });

  it('retorna 400 quando campos obrigatórios não são enviados', async () => {
    const res = await request(app).post('/auth/register').send({ nome: 'Teste' });

    expect(res.status).toBe(400);
    expect(UsuarioModel.criar).not.toHaveBeenCalled();
  });

  it('sorteia 10 ações da tabela acao e salva como favoritas ao criar conta', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ nome: 'Novo Usuário', email: 'novo@teste.com', senha: 'senha123' });

    expect(res.status).toBe(201);
    expect(res.body.acoesIniciais).toHaveLength(10);
    expect(new Set(res.body.acoesIniciais).size).toBe(10);
    res.body.acoesIniciais.forEach((codigo) => {
      expect(codigo).toMatch(/^ACAO\d+$/);
    });

    expect(UsuarioModel.criar).toHaveBeenCalled();
    expect(UsuarioModel.listarTodasAcoes).toHaveBeenCalled();
    expect(UsuarioModel.sortearAcoes).toHaveBeenCalledWith(acoesNoBanco, 10);
    expect(UsuarioModel.adicionarAcoesFavoritas).toHaveBeenCalledWith(
      1,
      res.body.acoesIniciais
    );
  });

  it('retorna 400 quando o e-mail já está cadastrado', async () => {
    const erro = new Error('Duplicado');
    erro.code = 'ER_DUP_ENTRY';
    UsuarioModel.criar.mockRejectedValue(erro);

    const res = await request(app)
      .post('/auth/register')
      .send({ nome: 'Teste', email: 'dup@teste.com', senha: 'senha123' });

    expect(res.status).toBe(400);
    expect(UsuarioModel.listarTodasAcoes).not.toHaveBeenCalled();
    expect(UsuarioModel.adicionarAcoesFavoritas).not.toHaveBeenCalled();
  });
});

describe('UsuarioModel.sortearAcoes', () => {
  const { sortearAcoes } = jest.requireActual('../src/models/usuarioModel');

  it('retorna no máximo 10 códigos distintos', () => {
    const codigos = Array.from({ length: 20 }, (_, i) => `TICK${i}`);
    const sorteados = sortearAcoes(codigos, 10);

    expect(sorteados).toHaveLength(10);
    expect(new Set(sorteados).size).toBe(10);
  });

  it('retorna todos os códigos quando há menos de 10 disponíveis', () => {
    const codigos = ['PETR4', 'VALE5', 'COGN3'];
    const sorteados = sortearAcoes(codigos, 10);

    expect(sorteados).toHaveLength(3);
    expect(new Set(sorteados)).toEqual(new Set(codigos));
  });
});
