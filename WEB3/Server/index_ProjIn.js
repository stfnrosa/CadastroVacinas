//https://expressjs.com/
//https://nodemon.io/
//https://expressjs.com/en/resources/middleware/cors/
//https://www.npmjs.com/package/mssql

//npm install mssql msnodesqlv8


const express = require('express');
const cors = require('cors');
let app = express();
let bodyParser = require('body-parser');
let methodOvirride = require('method-override');
app.use(express.json());// antigamenete era o body-parser precisa ser instalado, mas agora já vem junto com o express
let port = 3010;


// Permite que você use verbos HTTP
app.use(methodOvirride('X-HTTP-Method'));
app.use(methodOvirride('X-HTTP-Method-Override'));
app.use(methodOvirride('X-Method-Override'));
app.use(methodOvirride('_method'));



app.use((req, resp, next) => {
    resp.header("Access-Control-Allow-Origin", "*");
    resp.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next()
})


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ====== INSTALAR MULTER https://www.npmjs.com/package/multer
//=== npm install multer

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { sql, conectar } = require('./database.js');
// const { MAX } = require('mssql');
// const { decapsulate } = require('crypto');

app.use(cors());

//===========Multer CONFIGURAR O DIRETORIO ===============

const pastaUploads = path.join(__dirname, "./img");

app.use("/img", express.static(pastaUploads));

if (!fs.existsSync(pastaUploads)) {
    fs.mkdirSync(pastaUploads, { recursive: true });
}

const storage = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, pastaUploads);
    },

    filename: function (req, file, cb) {

        const extensao = path.extname(file.originalname);

        const nomeArquivo =
            `${Date.now()}-${Math.round(Math.random() * 1E9)}${extensao}`;

        cb(null, nomeArquivo);
    }
});

const upload = multer({
    storage: storage
});


app.use("/img", express.static(pastaUploads));

//=======================================


//========== LER A QUANTIDADE DE REGISTRO  ANIMAIS ============
app.get('/qtd', async (req, resp) => {
    try {
        // FAZER  A CONTAGEM DE REGISTRO
        const cn = await conectar();
        const qtd = await cn.request().query("SELECT COUNT(*) as total FROM ANIMAL");
        resp.json({ "qtd": qtd.recordset[0].total });
    }
    catch (error) {
        resp.json({ "tipo de erro ": error })
   }
})




app.get('/vacinas', async (req, resp) => {
    try {
        const cn = await conectar();
        const querySql = `SELECT
                                vacina.id_vacina,
                                vacina.nome,
                                vacina.descricao,
                                vacina.especie,
                                vacina.tipo,
                                lote.numero_lote      AS lote,
                                lote.data_fabricacao  AS dataFabricacao,
                                lote.data_validade    AS validade,
                                lote.quantidade_disponivel AS quantidade,
                                lote.valor_unitario   AS valorUnitario,
                                lote.responsavel      AS responsavel,
                                lote.temperatura      AS temperatura,
                                lote.local_armazenamento AS localArmazenamento,
                                fabricante.nome        AS fabricante,
                                fornecedor.nome        AS fornecedor,
                                entrada.data_entrada   AS dataEntrada,
                                entrada.nota_fiscal    AS notaFiscal,
                                entrada.valor_total    AS valorTotal
                          FROM VACINA vacina
                          CROSS APPLY (
                                SELECT TOP 1 *
                                FROM LOTE_VACINA lv
                                WHERE lv.id_vacina = vacina.id_vacina
                                ORDER BY lv.id_lote_vacina DESC
                          ) lote
                          LEFT JOIN FABRICANTE fabricante
                                ON fabricante.id_fabricante = lote.id_fabricante
                          LEFT JOIN ENTRADA_ESTOQUE entrada
                                ON entrada.id_entrada = lote.id_entrada
                          LEFT JOIN FORNECEDOR fornecedor
                                ON fornecedor.id_fornecedor = entrada.id_fornecedor
                          ORDER BY vacina.id_vacina DESC`;

        const resultado = await cn.request().query(querySql);
        resp.json(resultado.recordset);
    }
    catch (error) {
        resp.json({ "tipo de erro ": error })
    }


})


 app.get('/qtdvacinas', async (req, resp) => {
    try {
        // FAZER  A CONTAGEM DE REGISTRO
        const cn = await conectar();
        const resultado= await cn.request().query("SELECT COUNT(*) AS TOTAL  FROM VACINA");
        resp.json({"qtd": resultado.recordset[0].TOTAL});
    }
    catch (error) {
        resp.json({ "tipo de erro ": error })
    }


})

//===================================================================



//==== MONTAR A  TABELA DE LISTA DE ANIMAL ===============
app.get("/animais", async (req, resp) => {
    try {
        // FAZER  A CONTAGEM DE REGISTRO
        const cn = await conectar();
        const querySql = `SELECT 
                                    animal.id_animal, 
                                    animal.nome, 
                                    animal.rg, 
                                    animal.especie, 
                                    animal.porte,  
                                    animal.raca, 
                                    animal.idade,  
                                    animal.sexo,
                                    animal.status,  
                                    foto.url_foto,
                                    foto.principal
                          from ANIMAL inner join  foto
                          on ANIMAL.id_animal = foto.id_animal
                             where foto.principal = 1 
                             ORDER BY  animal.id_animal DESC`;

        const campos = await cn.request().query(querySql);
        resp.json(campos.recordset);
    }
    catch (error) {
        resp.json({ "tipo de erro ": error })
    }
})

app.get('/', async (req, res) => {
    // fazer diretamente a conexão com o banco de dados
    const cn = await conectar();
    // fazer o query para testar a conexão com o banco de dados
    const result = await cn.request().query("SELECT * FROM ANIMAL");
    //res.send('Conexão com o banco de dados realizada com sucesso!');    
    res.json(result.recordset);
    //res.send('Hsadasl');
});

//========== CADASTRO DE ANIMAIS ========================
// INSERT
app.post("/INSERT", upload.array("fotos", 3), async (req, res) => {
    const {
        id,
        nome,
        rg,
        tipo,
        porte,
        raca,
        idade,
        sexo,
        status,
        fotos,
        fotoPrincipal

    } = req.body;

    // está pegando os dados do corpo da requisição
    console.log("=================================");
    console.log("FOTO PRINCIPAL RECEBIDA:");
    console.log(fotoPrincipal);
    console.log("TIPO:");
    console.log(typeof fotoPrincipal);
    console.log("FOTOS RECEBIDAS:");
    console.log(req.files);
    console.log("=================================");
    const cn = await conectar();


    // conectando com o banco de dados
    // Executar INSERT
    const result = await cn
        .request()
        .input('nome', sql.VarChar(100), nome)
        .input('rg', sql.VarChar(100), rg)
        .input('tipo', sql.VarChar(100), tipo)
        .input('porte', sql.VarChar(100), porte)
        .input('raca', sql.VarChar(100), raca)
        .input('idade', sql.VarChar(100), idade)
        .input('sexo', sql.Char(1), sexo)
        .input('status', sql.VarChar(100), status)
        .query(`
                INSERT INTO ANIMAL
            (
                nome,
                rg,
                especie,
                porte,
                raca,
                idade,
                sexo,
                status
            )
                OUTPUT INSERTED.*
            VALUES
                (
                    @nome,
                    @rg,
                    @tipo,
                    @porte,
                    @raca,
                    @idade,
                    @sexo,
                    @status
                )
                `);


    // Pegar o ID DO ANIMAL E COLOCAR  NA TABELA FOTO
    // ==========================================

    const idAnimal = result.recordset[0].id_animal;
    // 3 - CADASTRAR AS FOTOS
    // ==========================================

    if (req.files && req.files.length > 0) {

        for (let i = 0; i < req.files.length; i++) {
            const foto = req.files[i];
            // Caminho que será salvo no banco
            const caminhoFoto = `/img/${foto.filename}`;
            console.log("Foto:", caminhoFoto);
            await cn
                .request()
                .input("id_animal", sql.Int, idAnimal)
                .input("url_foto", sql.VarChar(255), caminhoFoto)
                .input("principal", sql.Bit, i === Number(fotoPrincipal)
                )
                .query(`
                        INSERT INTO FOTO
            (
                id_animal,
                url_foto,
                principal,
                data_cadastro
            )
        VALUES
            (
                @id_animal,
                @url_foto,
                @principal,
                GETDATE()
            )
            `);
        }
    }


    res.status(201).json({
        mensagem: 'Usuário cadastrado com sucesso!',
        usuario: result.recordset[0]
        //foto: foto.recordset[0]

    });
});


        // FAZER UM OBJETO PARA RECEBER OS REQ
        const {
            nome,
            descricao,
            especie,
            tipo,
            fabricante,
            lote,
            dataFabricacao,
            dataValidade,
            quantidadeRecebida,
            dataEntrada,
            responsavel,
            fornecedor,
            notaFiscal,
            valorUnitario,
            valorTotal,
            temperatura,
            localArmazenamento

        } = req.body;

        const cn = await conectar();

        //=========== 1) FABRICANTE: procura pelo nome, cria se não existir =====
        let id_fabricante = null;
        if (fabricante && String(fabricante).trim() !== "") {
            const achadoFab = await cn.request()
                .input("nome", sql.VarChar(100), fabricante)
                .query(`SELECT id_fabricante FROM FABRICANTE WHERE nome = @nome`);

            if (achadoFab.recordset.length > 0) {
                id_fabricante = achadoFab.recordset[0].id_fabricante;
            } else {
                const criadoFab = await cn.request()
                    .input("nome", sql.VarChar(100), fabricante)
                    .query(`INSERT INTO FABRICANTE (nome) OUTPUT INSERTED.* VALUES (@nome)`);
                id_fabricante = criadoFab.recordset[0].id_fabricante;
            }
        }

        //=========== 2) FORNECEDOR: mesma ideia do fabricante =====
        let id_fornecedor = null;
        if (fornecedor && String(fornecedor).trim() !== "") {
            const achadoForn = await cn.request()
                .input("nome", sql.VarChar(100), fornecedor)
                .query(`SELECT id_fornecedor FROM FORNECEDOR WHERE nome = @nome`);

            if (achadoForn.recordset.length > 0) {
                id_fornecedor = achadoForn.recordset[0].id_fornecedor;
            } else {
                const criadoForn = await cn.request()
                    .input("nome", sql.VarChar(100), fornecedor)
                    .query(`INSERT INTO FORNECEDOR (nome) OUTPUT INSERTED.* VALUES (@nome)`);
                id_fornecedor = criadoForn.recordset[0].id_fornecedor;
            }
        }

        //=========== 3) ENTRADA_ESTOQUE: só dá pra criar se tiver fornecedor
        // e data de entrada (são colunas NOT NULL na tabela) =====
        let id_entrada = null;
        if (id_fornecedor && dataEntrada) {
            const entrada = await cn.request()
                .input("id_fornecedor", sql.Int, id_fornecedor)
                .input("dataEntrada", sql.Date, dataEntrada)
                .input("notaFiscal", sql.VarChar(50), notaFiscal || null)
                .input("valorTotal", sql.Decimal(10, 2), Number(valorTotal) || 0)
                .query(`
                    INSERT INTO ENTRADA_ESTOQUE (id_fornecedor, data_entrada, nota_fiscal, valor_total)
                    OUTPUT INSERTED.*
                    VALUES (@id_fornecedor, @dataEntrada, @notaFiscal, @valorTotal)
                `);
            id_entrada = entrada.recordset[0].id_entrada;
        }

        //=========== 4) VACINA (cabeçalho) =====
        let resultado = await cn.request()
            .input('nome', sql.VarChar(100), nome)
            .input('descricao', sql.VarChar(250), descricao)
            .input('especie', sql.VarChar(100), especie)
            .input('tipo', sql.VarChar(100), tipo)
            .query(`
          INSERT INTO VACINA(
            nome,
            descricao,
            especie,
            tipo
          )
              OUTPUT INSERTED.*
         VALUES(
            @nome,
            @descricao,
            @especie,
            @tipo
         )
        `)

       //============== 5) LOTE_VACINA (detalhe) PEGAR O ID DA VACINA ===========
       const id_v = resultado.recordset[0].id_vacina;
       resultado = await cn.request()
       .input("id_v", sql.Int, id_v)
       .input("id_fabricante", sql.Int, id_fabricante)
       .input("id_entrada", sql.Int, id_entrada)
       .input("lote", sql.VarChar(30), lote)
       .input("dataFabricacao", sql.Date, dataFabricacao)
       .input("dataValidade", sql.Date, dataValidade)
       .input("quantidadeRecebida", sql.Int, quantidadeRecebida)
       .input("valorUnitario", sql.Decimal(10, 2), valorUnitario ? Number(valorUnitario) : null)
       .input("responsavel", sql.VarChar(100), responsavel || null)
       .input("temperatura", sql.VarChar(50), temperatura || null)
       .input("localArmazenamento", sql.VarChar(100), localArmazenamento || null)
       .query(`
         INSERT INTO LOTE_VACINA (
                    id_vacina,
                    id_fabricante,
                    id_entrada,
                    numero_lote,
                    data_fabricacao,
                    data_validade,
                    quantidade_total,
                    quantidade_disponivel,
                    valor_unitario,
                    responsavel,
                    temperatura,
                    local_armazenamento)
                OUTPUT INSERTED.*
                VALUES
                    ( @id_v,
                      @id_fabricante,
                      @id_entrada,
                      @lote,
                      @dataFabricacao,
                      @dataValidade,
                      @quantidadeRecebida,
                      @quantidadeRecebida,
                      @valorUnitario,
                      @responsavel,
                      @temperatura,
                      @localArmazenamento )

        `)




        // VER SE ESTÁ RETORNAR O DADOS CADASTRADO
        resp.status(201).json(
            {
                "MS": "OK",
                //"ID": resultado.recordset[0].id_vacina
            })

    } catch (e) {
        resp.status(500).json({ "error:": e.message });
    }

})





// DELETE
app.delete('/usuarios/:id', async (req, res) => {

    try {

        // Pegar o ID da URL
        const id = parseInt(req.params.id);

        // Conectar ao SQL Server
        const cn = await conectar();

        // Executar DELETE
        const result = await cn
            .request()
            .input('id', sql.Int, id)
            .query(`
                DELETE FROM USUARIO
                OUTPUT DELETED.*
            WHERE id_usuario = @id
                `);

        // Verificar se encontrou o usuário
        if (result.recordset.length === 0) {

            return res.status(404).json({
                mensagem: 'Usuário não encontrado'
            });

        }

        // Retornar confirmação
        res.status(200).json({
            mensagem: 'Usuário excluído com sucesso!',
            usuario: result.recordset[0]
        });

    } catch (erro) {

        console.error('Erro:', erro);

        res.status(500).json({
            erro: 'Erro ao excluir usuário',
            detalhe: erro.message
        });

    }

});


// ALTERAR
app.put('/usuarios/:id', async (req, res) => {

    // testa a os dados indo -----------

    // console.log("ID:", req.params.id);
    // console.log("BODY:", req.body);

    // res.json({
    //     id: req.params.id,
    //     dados: req.body
    // });
    //-----------------------------------

    try {

        // Pegar o ID da URL
        const id = parseInt(req.params.id);
        console.log(req.body);
        // Pegar os dados do corpo da requisição
        const {
            nome,
            email,
            telefone,
            senha,
            cpf_cnpj,
            tipo_pessoa,
            data_nasc,
            status } = req.body;



        // //     // Atualizar usuário
        const cn = await conectar();
        const result = await cn
            .request()
            .input('id', sql.Int, id)
            .input('nome', sql.VarChar(100), nome)
            .input('email', sql.VarChar(100), email)
            .input('telefone', sql.VarChar(20), telefone)
            .input('senha', sql.VarChar(255), senha)
            .input('cpf_cnpj', sql.VarChar(18), cpf_cnpj)
            .input('tipo_pessoa', sql.Char(1), tipo_pessoa)
            .input('data_nasc', sql.Date, data_nasc)
            .input('status', sql.Char(1), status)
            .query(`
                UPDATE USUARIO
        SET
        nome = @nome,
            email = @email,
            telefone = @telefone,
            senha = @senha,
            cpf_cnpj = @cpf_cnpj,
            tipo_pessoa = @tipo_pessoa,
            data_nasc = @data_nasc,
            status = @status
                OUTPUT INSERTED.*
            WHERE id_usuario = @id
                `);
        // Verificar se o usuário existe
        if (result.recordset.length === 0) {

            return res.status(404).json({
                mensagem: 'Usuário não encontrado'
            });

        }

        // Retornar usuário atualizado
        res.status(200).json({
            mensagem: 'Usuário atualizado com sucesso!',
            usuario: result.recordset[0]
        });

    } catch (erro) {

        console.error('Erro:', erro);

        res.status(500).json({
            erro: 'Erro ao atualizar usuário',
            detalhe: erro.message
        });

    }

});




app.listen(port, () => {
    console.log(`Servidor http://localhost:${port}`);
}); 