/*
===============================================================================
AJUSTE_VACINA.sql

Para que serve este arquivo:
O cadastro de vacinas (Server/index_ProjIn.js, rota POST /addvacina) grava
nome, descricao, especie e tipo na tabela VACINA. O script original
(GESTAO_ANIMAL_SQL_SERVER_CORRIGIDO.sql) criou a tabela VACINA só com
(id_vacina, nome, descricao) - sem especie/tipo.

Isso é parecido com o que já existe no cadastro de animais: o INSERT INTO
ANIMAL usa a coluna "rg", mas o script .sql de criação da tabela ANIMAL não
tem essa coluna. Ou seja, o banco de dados REAL já estava alterado
manualmente depois que os scripts .sql foram escritos (conferido direto no
banco desta máquina: VACINA já tinha "tipo" e "especie" quando este script
rodou aqui).

IMPORTANTE sobre "fabricante": ele NÃO é uma coluna de texto na VACINA. O
banco já tem uma tabela FABRICANTE (id_fabricante, nome, pais) e a tabela
LOTE_VACINA já tem a coluna id_fabricante (chave estrangeira para
FABRICANTE). Ou seja, fabricante é um dado do LOTE, não da vacina em si -
faz sentido, porque o mesmo tipo de vacina pode vir de fabricantes
diferentes em lotes diferentes. Por isso o servidor (Server/index_ProjIn.js)
foi ajustado para: procurar o fabricante pelo nome na tabela FABRICANTE
(criando se ainda não existir) e gravar o id_fabricante no LOTE_VACINA, em
vez de guardar o nome do fabricante direto na VACINA.

Rode este arquivo no banco GESTAO_ANIMAL desta máquina antes de testar o
cadastro de vacinas. Ele só adiciona as colunas que ainda faltarem e não
mexe em nenhum dado existente. É seguro rodar mais de uma vez (os IFs
verificam se a coluna já existe antes de criar).
===============================================================================
*/

USE GESTAO_ANIMAL;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.VACINA') AND name = 'especie'
)
BEGIN
    ALTER TABLE dbo.VACINA ADD especie VARCHAR(100) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.VACINA') AND name = 'tipo'
)
BEGIN
    ALTER TABLE dbo.VACINA ADD tipo VARCHAR(100) NULL;
END
GO

/*
===============================================================================
LOTE_VACINA - campos do formulário que ainda não tinham onde serem salvos

O formulário de cadastro de vacinas (Entrada no Estoque / Armazenamento)
coleta: responsável, valor unitário, temperatura ideal e local de
armazenamento. Fornecedor, data de entrada, nota fiscal e valor total já
têm tabela própria (ENTRADA_ESTOQUE + FORNECEDOR) - só faltava ligar o
LOTE_VACINA a elas.

- id_entrada: liga o lote à entrada de estoque (fornecedor, data de
  entrada, nota fiscal e valor total ficam em ENTRADA_ESTOQUE/FORNECEDOR,
  sem duplicar esses dados na própria vacina);
- valor_unitario: fica no lote porque é o preço daquele lote específico;
- responsavel: texto simples (não usa a tabela PROFISSIONAL porque lá
  "tipo" é obrigatório e tem outro propósito - registrar quem aplica
  vacina no animal, não quem recebeu o lote no estoque);
- temperatura / local_armazenamento: condições de conservação daquele lote.
===============================================================================
*/

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.LOTE_VACINA') AND name = 'id_entrada'
)
BEGIN
    ALTER TABLE dbo.LOTE_VACINA ADD id_entrada INT NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_LOTE_VACINA_ENTRADA'
)
BEGIN
    ALTER TABLE dbo.LOTE_VACINA
        ADD CONSTRAINT FK_LOTE_VACINA_ENTRADA
        FOREIGN KEY (id_entrada) REFERENCES dbo.ENTRADA_ESTOQUE(id_entrada);
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.LOTE_VACINA') AND name = 'valor_unitario'
)
BEGIN
    ALTER TABLE dbo.LOTE_VACINA ADD valor_unitario DECIMAL(10,2) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.LOTE_VACINA') AND name = 'responsavel'
)
BEGIN
    ALTER TABLE dbo.LOTE_VACINA ADD responsavel VARCHAR(100) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.LOTE_VACINA') AND name = 'temperatura'
)
BEGIN
    ALTER TABLE dbo.LOTE_VACINA ADD temperatura VARCHAR(50) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.LOTE_VACINA') AND name = 'local_armazenamento'
)
BEGIN
    ALTER TABLE dbo.LOTE_VACINA ADD local_armazenamento VARCHAR(100) NULL;
END
GO

/*
Conferir se as colunas foram criadas:
*/
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'VACINA'
ORDER BY ORDINAL_POSITION;
GO

SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'LOTE_VACINA'
ORDER BY ORDINAL_POSITION;
GO
