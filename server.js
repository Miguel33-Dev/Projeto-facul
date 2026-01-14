const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Criar/Conectar ao banco de dados SQLite
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
  } else {
    console.log('Conectado ao banco de dados SQLite');
    inicializarBancoDados();
  }
});

// Inicializar tabelas do banco de dados
function inicializarBancoDados() {
  // Tabela de usuários
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL,
      perfil TEXT DEFAULT 'usuario',
      data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de produtos/itens de estoque
  db.run(`
    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      descricao TEXT,
      quantidade INTEGER DEFAULT 0,
      preco REAL,
      categoria TEXT,
      tipo_estoque TEXT,
      data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
      ultima_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de movimentações de estoque
  db.run(`
    CREATE TABLE IF NOT EXISTS movimentacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produto_id INTEGER NOT NULL,
      tipo TEXT NOT NULL,
      quantidade INTEGER NOT NULL,
      usuario_id INTEGER,
      observacao TEXT,
      data_movimentacao DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (produto_id) REFERENCES produtos(id),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )
  `);

  console.log('Tabelas do banco de dados inicializadas');
}

// Rota: Registrar usuário
app.post('/api/registro', (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Campos obrigatórios faltando' });
  }

  const senhaHash = bcrypt.hashSync(senha, 10);

  db.run(
    'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)',
    [nome, email, senhaHash],
    function (err) {
      if (err) {
        return res.status(400).json({ erro: 'Email já cadastrado ou erro ao registrar' });
      }
      res.json({ mensagem: 'Usuário registrado com sucesso', id: this.lastID });
    }
  );
});

// Rota: Login
app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'Email e senha obrigatórios' });
  }

  db.get('SELECT * FROM usuarios WHERE email = ?', [email], (err, usuario) => {
    if (err || !usuario) {
      return res.status(401).json({ erro: 'Email ou senha incorretos' });
    }

    if (!bcrypt.compareSync(senha, usuario.senha)) {
      return res.status(401).json({ erro: 'Email ou senha incorretos' });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      process.env.JWT_SECRET || 'sua_chave_secreta_aqui',
      { expiresIn: '24h' }
    );

    res.json({ mensagem: 'Login bem-sucedido', token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil } });
  });
});

// Rota: Obter todos os produtos
app.get('/api/produtos', (req, res) => {
  db.all('SELECT * FROM produtos', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao buscar produtos' });
    }
    res.json(rows);
  });
});

// Rota: Adicionar produto
app.post('/api/produtos', (req, res) => {
  const { nome, descricao, quantidade, preco, categoria, tipo_estoque } = req.body;

  db.run(
    'INSERT INTO produtos (nome, descricao, quantidade, preco, categoria, tipo_estoque) VALUES (?, ?, ?, ?, ?, ?)',
    [nome, descricao, quantidade, preco, categoria, tipo_estoque],
    function (err) {
      if (err) {
        return res.status(500).json({ erro: 'Erro ao adicionar produto' });
      }
      res.json({ mensagem: 'Produto adicionado com sucesso', id: this.lastID });
    }
  );
});

// Rota: Atualizar produto
app.put('/api/produtos/:id', (req, res) => {
  const { id } = req.params;
  const { nome, descricao, quantidade, preco, categoria, tipo_estoque } = req.body;

  db.run(
    'UPDATE produtos SET nome = ?, descricao = ?, quantidade = ?, preco = ?, categoria = ?, tipo_estoque = ?, ultima_atualizacao = CURRENT_TIMESTAMP WHERE id = ?',
    [nome, descricao, quantidade, preco, categoria, tipo_estoque, id],
    function (err) {
      if (err) {
        return res.status(500).json({ erro: 'Erro ao atualizar produto' });
      }
      res.json({ mensagem: 'Produto atualizado com sucesso' });
    }
  );
});

// Rota: Deletar produto
app.delete('/api/produtos/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM produtos WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao deletar produto' });
    }
    res.json({ mensagem: 'Produto deletado com sucesso' });
  });
});

// Rota: Registrar movimentação de estoque
app.post('/api/movimentacoes', (req, res) => {
  const { produto_id, tipo, quantidade, usuario_id, observacao } = req.body;

  db.run(
    'INSERT INTO movimentacoes (produto_id, tipo, quantidade, usuario_id, observacao) VALUES (?, ?, ?, ?, ?)',
    [produto_id, tipo, quantidade, usuario_id, observacao],
    function (err) {
      if (err) {
        return res.status(500).json({ erro: 'Erro ao registrar movimentação' });
      }
      res.json({ mensagem: 'Movimentação registrada com sucesso', id: this.lastID });
    }
  );
});

// Rota: Obter movimentações
app.get('/api/movimentacoes', (req, res) => {
  db.all('SELECT * FROM movimentacoes ORDER BY data_movimentacao DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao buscar movimentações' });
    }
    res.json(rows);
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
