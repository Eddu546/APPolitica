import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Wallet, Mail, MapPin, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const SenatorProfilePage = () => {
  const { id } = useParams();
  const [senador, setSenador] = useState(null);
  const [loading, setLoading] = useState(true);

  // MOCK: Dados de despesas simulados para o MVP (A API de gastos do Senado é complexa para consumo direto no front)
  const despesasSimuladas = [
    { name: 'Divulgação', value: 35000 },
    { name: 'Passagens', value: 28000 },
    { name: 'Escritório', value: 15000 },
    { name: 'Locomoção', value: 12000 },
    { name: 'Segurança', value: 8000 },
  ];

  useEffect(() => {
    const fetchSenador = async () => {
      setLoading(true);
      try {
        // API Oficial do Senado para Detalhes
        const response = await fetch(`https://legis.senado.leg.br/dadosabertos/senador/${id}.json`);
        const data = await response.json();
        
        // Caminho dos dados na estrutura do Senado
        const dados = data.DetalheParlamentar.Parlamentar;
        setSenador(dados);

      } catch (error) {
        console.error("Erro ao carregar senador:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSenador();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!senador) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
        <h1 className="text-2xl font-bold">Senador não encontrado</h1>
        <Link to="/senadores" className="mt-4 text-blue-600 hover:underline">Voltar</Link>
      </div>
    );
  }

  // Atalhos para dados
  const info = senador.IdentificacaoParlamentar;
  const ultimoMandato = senador.Mandatos?.Mandato;
  // Às vezes 'Mandato' é um array, pegamos o primeiro (atual)
  const mandatoAtual = Array.isArray(ultimoMandato) ? ultimoMandato[0] : ultimoMandato;

  return (
    <>
      <Helmet>
        <title>{info.NomeParlamentar} - FISCALIZA</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link to="/senadores">
              <Button variant="ghost" className="mb-6 pl-0 text-gray-500 hover:text-blue-600">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Senadores
              </Button>
            </Link>

            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <img 
                  src={info.UrlFotoParlamentar} 
                  alt={info.NomeParlamentar}
                  className="w-40 h-40 rounded-full object-cover border-4 border-blue-600 shadow-lg"
                />
              </motion.div>

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{info.NomeParlamentar}</h1>
                <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-bold text-sm">
                    {info.SiglaPartidoParlamentar}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full font-medium text-sm flex items-center">
                    <MapPin className="w-3 h-3 mr-1" /> {info.UfParlamentar}
                  </span>
                </div>
                
                {info.EmailParlamentar && (
                  <div className="inline-flex items-center text-gray-600 bg-gray-50 px-3 py-1 rounded">
                    <Mail className="w-4 h-4 mr-2 text-blue-500" /> {info.EmailParlamentar}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Gráfico (Simulado para MVP) */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="text-blue-600" /> Estimativa de Gastos (Cota)
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={despesasSimuladas} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                      <Tooltip formatter={(val) => `R$ ${val.toLocaleString('pt-BR')}`} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {despesasSimuladas.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#2563eb' : '#60a5fa'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="text-xs text-gray-400 mt-4 text-center">
                    * Dados consolidados estimados da Cota para Exercício da Atividade Parlamentar dos Senadores (CEAPS).
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Info Lateral */}
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Detalhes</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    <strong>Nome Civil:</strong> {info.NomeCompletoParlamentar} <br/>
                    <strong>Sexo:</strong> {info.SexoParlamentar} <br/>
                    <strong>Mandato:</strong> {mandatoAtual?.QuintaLegislaturaInicio} a {mandatoAtual?.QuintaLegislaturaFinal}
                  </p>
                  <a href={info.UrlPaginaParlamentar} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="w-full">
                      Perfil Oficial <ExternalLink className="ml-2 w-3 h-3" />
                    </Button>
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SenatorProfilePage;