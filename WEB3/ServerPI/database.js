//criando configuração de conexão
//módulo do mssql
require("dotenv").config();
const sql = require("mssql/msnodesqlv8");

//criar um objeto de configuração do banco (valores vêm do arquivo .env)
const database = {
    user:process.env.DB_USER || '',
    password:process.env.DB_PASSWORD || '',
    server:process.env.DB_SERVER || '',
    database:process.env.DB_NAME || 'GESTAO_ANIMAL',
    options:{
        encrypt: false,
        trustServerCertificate: true,
        trustedConnection: true
    },
    driver: 'ODBC Driver 17 for SQL Server'
}

//criar uma função para conectar o banco
async function Conectar(){
    const db = await sql.connect(database);
    console.log('Conectado!');
    return db;
}

//testar
Conectar();
module.exports = {sql, Conectar};