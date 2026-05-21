const precosFechamento = [
  { ticker: 'PETR4', fechamento: 30.84 },
  { ticker: 'VALE5', fechamento: 30.85 },
  { ticker: 'COGN3', fechamento: 2.89 },
  { ticker: 'B3SA3', fechamento: 15.01 },
];

const precosPorMinuto = {
  0: [
    { ticker: 'PETR4', preco: 31.04 },
    { ticker: 'VALE5', preco: 32.85 },
    { ticker: 'COGN3', preco: 2.97 },
    { ticker: 'B3SA3', preco: 13.95 },
  ],
  1: [
    { ticker: 'PETR4', preco: 31.0 },
    { ticker: 'VALE5', preco: 33.0 },
    { ticker: 'COGN3', preco: 3.0 },
    { ticker: 'B3SA3', preco: 14.0 },
  ],
  5: [
    { ticker: 'PETR4', preco: 30.9 },
    { ticker: 'VALE5', preco: 32.0 },
    { ticker: 'COGN3', preco: 2.95 },
    { ticker: 'B3SA3', preco: 14.5 },
  ],
  59: [
    { ticker: 'PETR4', preco: 30.5 },
    { ticker: 'VALE5', preco: 31.0 },
    { ticker: 'COGN3', preco: 2.8 },
    { ticker: 'B3SA3', preco: 14.0 },
  ],
};

function acaoEsperada(ticker, preco, fechamento) {
  const variacaoNominal = Number((preco - fechamento).toFixed(2));
  const variacaoPercentual = Number(((variacaoNominal / fechamento) * 100).toFixed(2));
  return {
    codigo: ticker,
    preco,
    variacao_nominal: variacaoNominal,
    variacao_percentual: variacaoPercentual,
  };
}

module.exports = {
  precosFechamento,
  precosPorMinuto,
  acaoEsperada,
};
