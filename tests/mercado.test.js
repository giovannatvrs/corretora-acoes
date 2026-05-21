const request = require('supertest');

jest.mock('../src/services/mercadoService');
jest.mock('../src/config/database');

const mercadoService = require('../src/services/mercadoService');
const db = require('../src/config/database');
const mercadoController = require('../src/controllers/mercadoController');
const app = require('../src/app');
const { headerAutenticado } = require('./helpers/authHelper');
const {
  precosFechamento,
  precosPorMinuto,
  acaoEsperada,
} = require('./helpers/mercadoFixtures');

function configurarMocksMercado() {
  mercadoService.obterPrecosFechamento.mockResolvedValue(precosFechamento);
  mercadoService.obterPrecosMinuto.mockImplementation(async (minuto) => {
    return precosPorMinuto[minuto] || precosPorMinuto[0];
  });
  mercadoService.mapearPrecosComVariacao.mockImplementation((precosMinuto, fechamento) => {
    const real = jest.requireActual('../src/services/mercadoService');
    return real.mapearPrecosComVariacao(precosMinuto, fechamento);
  });
}

function mockAcoesFavoritas(codigos) {
  db.execute.mockImplementation(async (sql, params) => {
    if (sql.includes('SELECT cod_acao FROM acoes_favoritadas')) {
      return [codigos.map((cod_acao) => ({ cod_acao })), []];
    }
    if (sql.includes('INSERT INTO acoes_favoritadas')) {
      return [{ insertId: 1 }, []];
    }
    if (sql.includes('DELETE FROM acoes_favoritadas')) {
      return [{ affectedRows: 1 }, []];
    }
    return [[], []];
  });
}

describe('Rotas /mercado — autenticação', () => {
  const rotasProtegidas = [
    { metodo: 'post', path: '/mercado/AvancaTempo', body: { incrementoMinutos: 1 } },
    { metodo: 'get', path: '/mercado/PegaTempo' },
    { metodo: 'get', path: '/mercado/ListaAcoesInteresse' },
    { metodo: 'post', path: '/mercado/AdicionaAcaoInteresse', body: { codigo: 'PETR4' } },
    { metodo: 'delete', path: '/mercado/RemoveAcaoInteresse', body: { codigo: 'PETR4' } },
  ];

  beforeEach(() => {
    mercadoController.resetMinutoSistema();
    jest.clearAllMocks();
    configurarMocksMercado();
  });

  it.each(rotasProtegidas)('$metodo $path retorna 401 sem token', async ({ metodo, path, body }) => {
    const req = request(app)[metodo](path);
    const res = body ? await req.send(body) : await req;

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Acesso negado. Token não fornecido.' });
  });

  it.each(rotasProtegidas)('$metodo $path retorna 403 com token inválido', async ({ metodo, path, body }) => {
    const req = request(app)[metodo](path).set('Authorization', 'Bearer token-invalido');
    const res = body ? await req.send(body) : await req;

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Token inválido ou expirado.' });
  });
});

describe('GET /mercado/PegaTempo', () => {
  beforeEach(() => {
    mercadoController.resetMinutoSistema();
    jest.clearAllMocks();
    configurarMocksMercado();
  });

  it('retorna 14:00 ao iniciar a sessão de negociação', async () => {
    const res = await request(app)
      .get('/mercado/PegaTempo')
      .set(headerAutenticado());

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ horaNegociacao: '14:00' });
  });

  it('mantém o horário após avançar o relógio (persistência na sessão)', async () => {
    await request(app)
      .post('/mercado/AvancaTempo')
      .set(headerAutenticado())
      .send({ incrementoMinutos: 5 });

    const res = await request(app)
      .get('/mercado/PegaTempo')
      .set(headerAutenticado());

    expect(res.status).toBe(200);
    expect(res.body.horaNegociacao).toBe('14:05');
  });
});

describe('POST /mercado/AvancaTempo', () => {
  beforeEach(() => {
    mercadoController.resetMinutoSistema();
    jest.clearAllMocks();
    configurarMocksMercado();
  });

  it('retorna 400 quando o incremento é inválido', async () => {
    const res = await request(app)
      .post('/mercado/AvancaTempo')
      .set(headerAutenticado())
      .send({ incrementoMinutos: 0 });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'O incremento de minutos é inválido.' });
    expect(mercadoService.obterPrecosMinuto).not.toHaveBeenCalled();
  });

  it('avança 1 minuto por padrão e retorna preços com variações', async () => {
    const res = await request(app)
      .post('/mercado/AvancaTempo')
      .set(headerAutenticado())
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.novaHoraNegociacao).toBe('14:01');
    expect(mercadoService.obterPrecosMinuto).toHaveBeenCalledWith(1);
    expect(res.body.acoes).toEqual(
      expect.arrayContaining([
        acaoEsperada('PETR4', 31.0, 30.84),
        acaoEsperada('VALE5', 33.0, 30.85),
      ])
    );
  });

  it('avança 5 minutos e atualiza o relógio para 14:05', async () => {
    const res = await request(app)
      .post('/mercado/AvancaTempo')
      .set(headerAutenticado())
      .send({ incrementoMinutos: 5 });

    expect(res.status).toBe(200);
    expect(res.body.novaHoraNegociacao).toBe('14:05');
    expect(mercadoService.obterPrecosMinuto).toHaveBeenCalledTimes(5);
    expect(mercadoService.obterPrecosMinuto).toHaveBeenLastCalledWith(5);
    expect(res.body.acoes).toEqual(
      expect.arrayContaining([acaoEsperada('PETR4', 30.9, 30.84)])
    );
  });

  it('não ultrapassa o minuto 59 da hora de negociação', async () => {
    await request(app)
      .post('/mercado/AvancaTempo')
      .set(headerAutenticado())
      .send({ incrementoMinutos: 57 });

    const res = await request(app)
      .post('/mercado/AvancaTempo')
      .set(headerAutenticado())
      .send({ incrementoMinutos: 5 });

    expect(res.status).toBe(200);
    expect(res.body.novaHoraNegociacao).toBe('14:59');
    expect(mercadoService.obterPrecosMinuto).toHaveBeenLastCalledWith(59);
  });

  it('retorna 500 quando falha ao obter preços de fechamento', async () => {
    mercadoService.obterPrecosFechamento.mockRejectedValue(new Error('API indisponível'));

    const res = await request(app)
      .post('/mercado/AvancaTempo')
      .set(headerAutenticado())
      .send({ incrementoMinutos: 1 });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Erro interno ao avançar o tempo.' });
  });
});

describe('GET /mercado/ListaAcoesInteresse', () => {
  beforeEach(() => {
    mercadoController.resetMinutoSistema();
    jest.clearAllMocks();
    configurarMocksMercado();
    mockAcoesFavoritas(['PETR4', 'VALE5']);
  });

  it('retorna apenas as ações favoritas do usuário com preço e variações', async () => {
    const res = await request(app)
      .get('/mercado/ListaAcoesInteresse')
      .set(headerAutenticado(42));

    expect(res.status).toBe(200);
    expect(res.body.horaNegociacao).toBe('14:00');
    expect(res.body.acoes).toHaveLength(2);
    expect(res.body.acoes).toEqual(
      expect.arrayContaining([
        acaoEsperada('PETR4', 31.04, 30.84),
        acaoEsperada('VALE5', 32.85, 30.85),
      ])
    );
    expect(db.execute).toHaveBeenCalledWith(
      'SELECT cod_acao FROM acoes_favoritadas WHERE user_id = ?',
      [42]
    );
  });

  it('usa o minuto atual do relógio após avançar o tempo', async () => {
    await request(app)
      .post('/mercado/AvancaTempo')
      .set(headerAutenticado())
      .send({ incrementoMinutos: 1 });

    const res = await request(app)
      .get('/mercado/ListaAcoesInteresse')
      .set(headerAutenticado());

    expect(res.status).toBe(200);
    expect(res.body.horaNegociacao).toBe('14:01');
    expect(mercadoService.obterPrecosMinuto).toHaveBeenLastCalledWith(1);
  });

  it('retorna 500 quando ocorre erro no banco', async () => {
    db.execute.mockRejectedValue(new Error('Falha no banco'));

    const res = await request(app)
      .get('/mercado/ListaAcoesInteresse')
      .set(headerAutenticado());

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Erro ao listar ações de interesse.' });
  });
});

describe('POST /mercado/AdicionaAcaoInteresse', () => {
  beforeEach(() => {
    mercadoController.resetMinutoSistema();
    jest.clearAllMocks();
    configurarMocksMercado();
    mockAcoesFavoritas(['PETR4']);
  });

  it('retorna 400 quando o código não é enviado', async () => {
    const res = await request(app)
      .post('/mercado/AdicionaAcaoInteresse')
      .set(headerAutenticado())
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Código da ação é obrigatório.' });
  });

  it('adiciona ação e retorna a lista atualizada', async () => {
    const res = await request(app)
      .post('/mercado/AdicionaAcaoInteresse')
      .set(headerAutenticado(7))
      .send({ codigo: 'vale5' });

    expect(res.status).toBe(200);
    expect(db.execute).toHaveBeenCalledWith(
      'INSERT INTO acoes_favoritadas (user_id, cod_acao) VALUES (?, ?)',
      [7, 'VALE5']
    );
    expect(res.body.acoes).toEqual(
      expect.arrayContaining([expect.objectContaining({ codigo: 'PETR4' })])
    );
  });

  it('retorna a lista quando a ação já está cadastrada', async () => {
    const erroDuplicado = new Error('Duplicado');
    erroDuplicado.code = 'ER_DUP_ENTRY';
    db.execute.mockRejectedValueOnce(erroDuplicado);

    const res = await request(app)
      .post('/mercado/AdicionaAcaoInteresse')
      .set(headerAutenticado())
      .send({ codigo: 'PETR4' });

    expect(res.status).toBe(200);
    expect(res.body.acoes).toBeDefined();
  });
});

describe('DELETE /mercado/RemoveAcaoInteresse', () => {
  beforeEach(() => {
    mercadoController.resetMinutoSistema();
    jest.clearAllMocks();
    configurarMocksMercado();
    mockAcoesFavoritas(['PETR4', 'VALE5']);
  });

  it('retorna 400 quando o código não é enviado', async () => {
    const res = await request(app)
      .delete('/mercado/RemoveAcaoInteresse')
      .set(headerAutenticado())
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Código da ação é obrigatório.' });
  });

  it('remove a ação e retorna a lista atualizada', async () => {
    mockAcoesFavoritas(['VALE5']);

    const res = await request(app)
      .delete('/mercado/RemoveAcaoInteresse')
      .set(headerAutenticado(3))
      .send({ codigo: 'petr4' });

    expect(res.status).toBe(200);
    expect(db.execute).toHaveBeenCalledWith(
      'DELETE FROM acoes_favoritadas WHERE user_id = ? AND cod_acao = ?',
      [3, 'PETR4']
    );
    expect(res.body.acoes.find((a) => a.codigo === 'PETR4')).toBeUndefined();
  });
});

describe('mercadoService.mapearPrecosComVariacao', () => {
  const mercadoServiceReal = jest.requireActual('../src/services/mercadoService');

  it('calcula variação nominal e percentual em relação ao fechamento', () => {
    const resultado = mercadoServiceReal.mapearPrecosComVariacao(
      [{ ticker: 'PETR4', preco: 31.04 }],
      [{ ticker: 'PETR4', fechamento: 30.84 }]
    );

    expect(resultado[0]).toEqual({
      codigo: 'PETR4',
      preco: 31.04,
      variacao_nominal: 0.2,
      variacao_percentual: 0.65,
    });
  });

  it('ignora tickers sem fechamento correspondente', () => {
    const resultado = mercadoServiceReal.mapearPrecosComVariacao(
      [{ ticker: 'XXXX3', preco: 10 }],
      precosFechamento
    );

    expect(resultado).toEqual([]);
  });
});
