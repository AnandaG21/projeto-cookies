import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';

const app = express();

// Configurações
app.use(express.urlencoded({ extended: true })); // Para processar dados enviados via formulário
import path from 'path';
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));
app.use(cookieParser());
app.use(
    session({
        secret: 'S3cr3tK3y',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false, httpOnly: true, maxAge: 1000 * 60 * 30 },
    })
);

const PORT = 3000;
const HOST = 'localhost';

let productList = [];

// Middleware de autenticação
function checkAuthentication(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.send(`
            <html>
                <body>
                    <h1>Acesso negado!</h1>
                    <p>Por favor, faça o login para acessar esta página.</p>
                    <a href="/login.html">Ir para Login</a>
                </body>
            </html>
        `);
    }
}

// Handler de login
function loginHandler(req, res) {
    const { username, password } = req.body;
    console.log('Credenciais recebidas:', { username, password });

    if (username == 'Renato' && password == '1234') {
        req.session.user = username;
        res.cookie('lastAccess', new Date().toLocaleString(), {
            maxAge: 1000 * 60 * 60 * 24 * 30,
            httpOnly: true,
        });
        res.redirect('/productForm');
    } else {
        res.send(`
            <html>
                <body>
                    <h1>Usuário ou senha inválidos!</h1>
                    <a href="/login.html">Tentar novamente</a>
                </body>
            </html>
        `);
    }
}

// Handler de logout
function logoutHandler(req, res) {
    req.session.destroy();
    res.redirect('/login.html');
}

// Formulário de produtos
function productForm(req, res) {
    const lastAccess = req.cookies['lastAccess'] || 'N/A';
    res.send(`
        <html>
        <head>
        <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #E6E6FA; /* Cor lilás clara para o fundo */
            margin: 0;
            padding: 0;
            color: #333;
        }

        h1, h2 {
            text-align: center;
            color: #4B0082; /* Cor roxa escura para títulos */
        }

        form {
            display: flexbox;
            flex-direction: column;
            columns: 2;
            background-color: #FFF;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            width: 400px;
            margin-left:  20px;
        }

        input[type="text"],
        input[type="number"],
        input[type="date"] {
            padding: 8px;
            width: 90%;
            border: 1px solid #ccc;
            border-radius: 4px;
        }

        button {
            background-color: #4B0082; /* Cor roxa */
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
        }

        button:hover {
            background-color: #6A0DAD; /* Tom mais escuro quando passar o mouse */
        }

        table {
            width: 90%;
            margin: 20px auto;
            border-collapse: collapse;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        th, td {
            padding: 12px;
            text-align: left;
            border: 1px solid #ddd;
        }

        th {
            background-color: #4B0082; /* Cor roxa escura */
            color: white;
        }

        td {
            background-color: #f9f9f9;
        }

        button.delete {
            background-color: #FF6347; /* Cor de botão para deletar */
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
        }

        button.delete:hover {
            background-color: #FF4500; /* Tom mais escuro para o hover */
        }
        </style>
        </head>

            <body>
                <h1>Cadastro de Produtos</h1>
                <p>Último acesso: ${lastAccess}</p>
                <form method="POST" action="/addProduct">
                    <label>Código de Barras: <input type="text" name="barcode" required /></label><br />
                    <label>Descrição: <input type="text" name="description" required /></label><br />
                    <label>Preço de Custo: <input type="number" step="0.01" name="costPrice" required /></label><br />
                    <label>Preço de Venda: <input type="number" step="0.01" name="salePrice" required /></label><br />
                    <label>Data de Validade: <input type="date" name="expiryDate" required /></label><br />
                    <label>Qtd em Estoque: <input type="number" name="stock" required /></label><br />
                    <label>Nome do Fabricante: <input type="text" name="manufacturer" required /></label><br />
                    <br>
                    <button type="submit">Cadastrar</button>
                </form>
                <h2>Produtos Cadastrados</h2>
                <table border="1">
                    <tr>
                        <th>Código</th>
                        <th>Descrição</th>
                        <th>Preço de Custo</th>
                        <th>Preço de Venda</th>
                        <th>Data de Validade</th>
                        <th>Qtd em Estoque</th>
                        <th>Fabricante</th>
                    </tr>
                    ${productList
                        .map(
                            (product) => `
                    <tr>
                        <td>${product.barcode}</td>
                        <td>${product.description}</td>
                        <td>${product.costPrice}</td>
                        <td>${product.salePrice}</td>
                        <td>${product.expiryDate}</td>
                        <td>${product.stock}</td>
                        <td>${product.manufacturer}</td>
                    </tr>`
                        )
                        .join('')}
                </table>
            </body>
        </html>
    `);
}
// Adicionar produto
function addProduct(req, res) {
    const { barcode, description, costPrice, salePrice, expiryDate, stock, manufacturer } = req.body;

    if (barcode && description && costPrice && salePrice && expiryDate && stock && manufacturer) {
        productList.push({ barcode, description, costPrice, salePrice, expiryDate, stock, manufacturer });
        res.redirect('/productForm');
    } else {
        res.send('<p>Por favor, preencha todos os campos.</p><a href="/productForm">Voltar</a>');
    }
}

// Rotas
app.get('/', (req, res) => res.sendFile(path.join(publicPath, 'login.html'));
app.post('/login', loginHandler);
app.get('/logout', logoutHandler);
app.get('/productForm', checkAuthentication, productForm);
app.post('/addProduct', checkAuthentication, addProduct);

// Inicializa o servidor
app.listen(PORT, HOST, () => {
    console.log(`Servidor rodando em http://${HOST}:${PORT}`);
});
