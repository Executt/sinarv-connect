UPDATE public.lixoes l SET
  municipio_ibge = d.ibge,
  populacao_municipio = d.pop,
  catadores_estimados = d.cat,
  possui_coleta_seletiva = d.cs,
  possui_plano_municipal = d.pm,
  consorcio_publico = d.cons,
  fonte_verificacao = d.fonte,
  data_ultima_verificacao = DATE '2026-06-30'
FROM (VALUES
  ('Manaus','1302603',2063547,1800,true,true,false,'MUNIC 2023 / IBGE'),
  ('Salvador','2927408',2417678,2200,true,true,false,'SNIS / busca ativa'),
  ('Fortaleza','2304400',2428708,2500,true,true,false,'MUNIC 2023 / IBGE'),
  ('Brasília','5300108',2817381,1500,true,true,false,'MUNIC 2023 / IBGE'),
  ('Cariacica','3201308',348738,420,true,true,true,'Consórcio intermunicipal'),
  ('Cuiabá','5103403',650877,700,true,true,false,'Imagem de satélite / busca ativa'),
  ('Belém','1501402',1303403,1900,true,true,false,'MUNIC 2023 / IBGE'),
  ('Jaboatão dos Guararapes','2607901',644620,800,true,true,true,'SNIS'),
  ('Curitiba','4106902',1773718,900,true,true,true,'SNIS'),
  ('Duque de Caxias','3301702',808195,1200,true,true,false,'SNIS'),
  ('Porto Alegre','4314902',1332570,850,true,true,true,'SNIS'),
  ('São Paulo','3550308',11451245,3000,true,true,false,'SNIS')
) AS d(mun, ibge, pop, cat, cs, pm, cons, fonte)
WHERE l.municipio = d.mun;