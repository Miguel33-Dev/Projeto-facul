const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Erro ao conectar:', err);
  } else {
    console.log('Conectado ao banco de dados');
    adicionarUsuarioTeste();
  }
});

function adicionarUsuarioTeste() {
  const nome = 'Usuário Teste';
  const email = 'teste@example.com';
  const senha = '123456';
  const senhaHash = bcrypt.hashSync(senha, 10);

  db.run(
    'INSERT OR IGNORE INTO usuarios (nome, email, senha) VALUES (?, ?, ?)',
    [nome, email, senhaHash],
    function(err) {
      if (err) {
        console.error('Erro:', err);
      } else {
        console.log('Usuário teste criado com sucesso!');
        console.log('Email: teste@example.com');
        console.log('Senha: 123456');
      }
      db.close();
    }
  );
}
