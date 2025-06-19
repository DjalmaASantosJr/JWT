const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { authenticateToken } = require('./middlewares/authenticateToken');
const { authorizeRoles } = require('./middlewares/authorizeRoles');
const products = require('./data/products');

dotenv.config();

const app = express();
const port = 3000;

app.use(bodyParser.json());

// Usuários simulados (não utilizar em produção)
const users = [
  { username: 'admin', password: 'admin123', role: 'admin' },
  { username: 'joao', password: '123456', role: 'user' }
];

// Rota de Login para gerar o Token JWT
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Verifica se o usuário existe
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Usuário ou senha inválidos' });
  }

  // Gera o token JWT
  const token = jwt.sign({ username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

  res.json({ token });
});

// Rota para listar os produtos (apenas autenticados)
app.get('/products', authenticateToken, (req, res) => {
  res.json(products);
});

// Rota para adicionar um produto (apenas admin)
app.post('/products', authenticateToken, authorizeRoles('admin'), (req, res) => {
  const { name, price } = req.body;
  const newProduct = { id: products.length + 1, name, price };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

// Rota para remover um produto (apenas admin)
app.delete('/products/:id', authenticateToken, authorizeRoles('admin'), (req, res) => {
  const { id } = req.params;
  const productIndex = products.findIndex(p => p.id === parseInt(id));

  if (productIndex === -1) {
    return res.status(404).json({ message: 'Produto não encontrado' });
  }

  products.splice(productIndex, 1);
  res.status(204).send();
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});