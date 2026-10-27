//npm install express 
// https://expressjs.com/
//https://www.npmjs.com/package/mssql

//módulo (biblioteca de criar um servidor)
const express = require('express');
const { sql, Conectar } = require('./database.js');
//cors
const cors = require('cors');
const app = express();

//porta de saída do servidor
const port = 3010;
//retornar o agente(navegador) em tipo json resposta
app.use(express.json());

//aplicando o cors no agente(navegador)
app.use(cors());
//ler a quantidade de regsitros do banco de dados
app.get('/qtd', async (req, res) => {
    try {
        //conexão com o banco de dados
        const conexao = await Conectar();
        //passar em forma de string um comando sql
        const resultado = await conexao.request().query('SELECT COUNT(*) AS total FROM ANIMAL');
        res.json({"qtd": resultado.recordset[0].total});
    } catch (error) {
        res.json({"Erro" : error});
    }
});

app.post('/insert', async (req, res) => {
    const nome = await req.body.nome;
    const email = await req.body.email;
    const telefone = await req.body.telefone;
    const senha = await req.body.senha;
    const cpf_cnpj = await req.body.cpf_cnpj;
    const tipo_pessoa = await req.body.tipo_pessoa;
    const data_nascimento = await req.body.data_nascimento;     
    //requisição de inserção no banco de dados

    
    const conwexao = await Conectar();
    //consulta de inserção no banco de dados
    const resultado = await conwexao.request().query(`INSERT INTO USUARIO (nome, email, telefone, senha, cpf_cnpj, tipo_pessoa, data_nascimento) VALUES ('${nome}', '${email}', '${telefone}', '${senha}', '${cpf_cnpj}', '${tipo_pessoa}', '${data_nascimento}')`);
    res.json({
        "dado": nome,
    });
});

//criar a execução do servidor
app.listen(port, () => {
    console.log(`servidor http://localhost:${port}`)
})
