-- =============================================================================
-- DADOS DE TESTE PARA A TELA "LISTA DE VACINAS"
-- Pré-requisito: GESTAO_ANIMAL_SQL_SERVER_CORRIGIDO.sql + AJUSTE_VACINA.sql
-- Pode ser executado mais de uma vez (ignora o que já existe).
-- As validades são relativas a hoje, para aparecerem todos os status:
--   Em estoque, Estoque baixo (<= 5), Vencendo (<= 30 dias) e Vencida.
-- =============================================================================
USE GESTAO_ANIMAL;
GO

SET NOCOUNT ON;

-- ---------- FABRICANTES ----------
INSERT INTO dbo.FABRICANTE (nome, pais)
SELECT v.nome, v.pais
FROM (VALUES
    ('Zoetis',            'Estados Unidos'),
    ('MSD Saúde Animal',  'Estados Unidos'),
    ('Boehringer Ingelheim', 'Alemanha'),
    ('Ceva',              'França'),
    ('Ourofino',          'Brasil')
) v(nome, pais)
WHERE NOT EXISTS (SELECT 1 FROM dbo.FABRICANTE f WHERE f.nome = v.nome);

-- ---------- FORNECEDORES ----------
INSERT INTO dbo.FORNECEDOR (nome, cnpj, telefone, email)
SELECT v.nome, v.cnpj, v.telefone, v.email
FROM (VALUES
    ('VetDistribuidora',  '11.222.333/0001-44', '(11) 3000-1000', 'vendas@vetdistribuidora.com.br'),
    ('Pet Saúde Atacado', '55.666.777/0001-88', '(11) 3000-2000', 'contato@petsaude.com.br'),
    ('AgroVet Brasil',    '99.888.777/0001-66', '(19) 3000-3000', 'comercial@agrovet.com.br')
) v(nome, cnpj, telefone, email)
WHERE NOT EXISTS (SELECT 1 FROM dbo.FORNECEDOR f WHERE f.cnpj = v.cnpj);

-- ---------- VACINAS ----------
INSERT INTO dbo.VACINA (nome, descricao, especie, tipo)
SELECT v.nome, v.descricao, v.especie, v.tipo
FROM (VALUES
    ('Vanguard Plus 8',   'Proteção contra cinomose, hepatite, parvovirose, parainfluenza, coronavirose e leptospirose.', 'Cão',   'V8'),
    ('Duramune Max 10',   'Vacina polivalente canina contra 10 agentes.',                                                'Cão',   'V10'),
    ('Nobivac Raiva',     'Vacina antirrábica de uso anual.',                                                            'Ambos', 'Antirrábica'),
    ('Felocell 4',        'Proteção contra rinotraqueíte, calicivirose, panleucopenia e clamidiose felina.',            'Gato',  'V4'),
    ('Felocell 3',        'Proteção contra rinotraqueíte, calicivirose e panleucopenia felina.',                        'Gato',  'V3'),
    ('Recombitek C6/CV',  'Vacina canina com proteção adicional contra coronavírus.',                                    'Cão',   'V10')
) v(nome, descricao, especie, tipo)
WHERE NOT EXISTS (SELECT 1 FROM dbo.VACINA x WHERE x.nome = v.nome);

-- ---------- ENTRADAS DE ESTOQUE ----------
-- (nota fiscal é a chave usada para não duplicar)
INSERT INTO dbo.ENTRADA_ESTOQUE (id_fornecedor, data_entrada, nota_fiscal, valor_total)
SELECT f.id_fornecedor, DATEADD(DAY, v.dias, CAST(GETDATE() AS DATE)), v.nf, v.total
FROM (VALUES
    ('11.222.333/0001-44', -60, 'NF-1001', 4500.00),
    ('11.222.333/0001-44', -45, 'NF-1002', 3200.00),
    ('55.666.777/0001-88', -30, 'NF-2001', 2100.00),
    ('55.666.777/0001-88', -20, 'NF-2002',  960.00),
    ('99.888.777/0001-66', -10, 'NF-3001', 1800.00),
    ('99.888.777/0001-66', -90, 'NF-3002',  450.00)
) v(cnpj, dias, nf, total)
JOIN dbo.FORNECEDOR f ON f.cnpj = v.cnpj
WHERE NOT EXISTS (SELECT 1 FROM dbo.ENTRADA_ESTOQUE e WHERE e.nota_fiscal = v.nf);

-- ---------- LOTES ----------
INSERT INTO dbo.LOTE_VACINA
    (id_vacina, id_fabricante, id_entrada, numero_lote,
     data_fabricacao, data_validade, quantidade_total, quantidade_disponivel,
     valor_unitario, responsavel, temperatura, local_armazenamento)
SELECT va.id_vacina, fa.id_fabricante, en.id_entrada, v.lote,
       DATEADD(DAY, v.dias_fab, CAST(GETDATE() AS DATE)),
       DATEADD(DAY, v.dias_val, CAST(GETDATE() AS DATE)),
       v.qtd_total, v.qtd_disp, v.valor, v.responsavel, v.temperatura, v.local
FROM (VALUES
    -- vacina,             fabricante,            NF,        lote,      fab,   val, total, disp, valor,  responsável,        temp,        local
    ('Vanguard Plus 8',   'Zoetis',               'NF-1001', 'VG8-2601', -180,  300, 100,   80,   45.00, 'Dra. Mariana Lima', '2°C a 8°C', 'Geladeira 1'),
    ('Duramune Max 10',   'Boehringer Ingelheim', 'NF-1002', 'DM10-2602',-150,  240,  80,   60,   52.00, 'Dra. Mariana Lima', '2°C a 8°C', 'Geladeira 1'),
    ('Nobivac Raiva',     'MSD Saúde Animal',     'NF-2001', 'NR-2603',  -120,  180, 150,  120,   18.00, 'Carlos Menezes',    '2°C a 8°C', 'Geladeira 2'),
    ('Felocell 4',        'Zoetis',               'NF-2002', 'FC4-2604', -100,   20,  60,   40,   48.00, 'Carlos Menezes',    '2°C a 8°C', 'Geladeira 2'),   -- vencendo
    ('Felocell 3',        'Zoetis',               'NF-3001', 'FC3-2605',  -90,  150,  30,    4,   38.00, 'Dra. Paula Souza',  '2°C a 8°C', 'Geladeira 3'),   -- estoque baixo
    ('Recombitek C6/CV',  'Ceva',                 'NF-3002', 'RC6-2501', -400,  -15,  20,   10,   55.00, 'Dra. Paula Souza',  '2°C a 8°C', 'Geladeira 3'),   -- vencida
    ('Nobivac Raiva',     'Ourofino',             'NF-1001', 'NR-2606',   -60,   12,  50,   25,   17.50, 'Carlos Menezes',    '2°C a 8°C', 'Geladeira 2')    -- vencendo (lote mais recente da Nobivac)
) v(vacina, fabricante, nf, lote, dias_fab, dias_val, qtd_total, qtd_disp, valor, responsavel, temperatura, local)
JOIN dbo.VACINA     va ON va.nome = v.vacina
JOIN dbo.FABRICANTE fa ON fa.nome = v.fabricante
JOIN dbo.ENTRADA_ESTOQUE en ON en.nota_fiscal = v.nf
WHERE NOT EXISTS (SELECT 1 FROM dbo.LOTE_VACINA l WHERE l.numero_lote = v.lote);

-- ---------- CONFERÊNCIA ----------
SELECT va.nome, va.tipo, va.especie, l.numero_lote, l.data_validade,
       l.quantidade_disponivel, fa.nome AS fabricante
FROM dbo.LOTE_VACINA l
JOIN dbo.VACINA va ON va.id_vacina = l.id_vacina
LEFT JOIN dbo.FABRICANTE fa ON fa.id_fabricante = l.id_fabricante
ORDER BY l.id_lote_vacina;
GO
