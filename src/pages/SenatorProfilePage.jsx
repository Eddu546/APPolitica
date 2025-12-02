import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Mail, MapPin, ExternalLink, 
  Loader2, ScrollText, PenTool, Shield, 
  GraduationCap, Banknote, HeartPulse, X,
  Wallet, Building
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import AdBanner from '@/components/AdBanner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// --- COMPONENTES AUXILIARES (Reutilizados para consistência visual) ---

const SimpleModal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl sticky top-0 z-10">
          <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-blue-600" /> {title}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500"/>
          </button>
        </div>
        <div className="p-4 overflow-y-auto custom-scrollbar">
          {children}
        </div>
        <div className="p-3 border-t bg-gray-50 rounded-b-xl text-right">
          <Button onClick={onClose} variant="outline" size="sm">Fechar</Button>
        </div>
      </div>
    </div>
  );
};

const ProjectList = ({ lista }) => (
  <div className="space-y-3">
    {lista.slice(0, 3).map((proj, idx) => (
      <div key={`${proj.id}-${idx}`} className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:border-blue-300 transition-all group">
          <div className="flex justify-between items-start gap-2 mb-2">
              <span className="text-[11px] uppercase font-bold px-2 py-1 rounded bg-slate-100 text-slate-700">
                  {proj.siglaTipo} {proj.numero}/{proj.ano}
              </span>
              <a href={`https://www25.senado.leg.br/web/atividade/materias/-/materia/${proj.id}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-blue-600" />
              </a>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{proj.ementa}</p>
      </div>
    ))}
    {lista.length === 0 && (
        <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <p>Nenhuma proposta encontrada nesta categoria.</p>
        </div>
    )}
  </div>
);

// --- PÁGINA PRINCIPAL ---

const SenatorProfilePage = () => {
  const { id } = useParams();
  const { toast } = useToast();
  
  // Estados
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear().toString());
  const [senador, setSenador] = useState(null);
  
  // Dados processados
  const [projetosTematicos, setProjetosTematicos] = useState({
    seguranca: [], economia: [], educacao: [], saude: [], pecs: [], outros: []
  });
  
  const [graficoData, setGraficoData] = useState([]);
  const [totalGastoPeriodo, setTotalGastoPeriodo] = useState(0);
  const [kpis, setKpis] = useState({ totalProjetos: 0, totalRelatorias: 0 });
  
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState('outros');

  const anosDisponiveis = ['2023', '2024', '2025'];

  // Helper para normalizar respostas da API do Senado (que retorna objeto único se só houver 1 item)
  const forceArray = (data) => {
    if (!data) return [];
    return Array.isArray(data) ? data : [data];
  };

  const normalize = (text) => text ? text.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";

  const categorizarProjeto = (projeto) => {
    const tipo = projeto.siglaTipo?.toUpperCase() || '';
    if (tipo.includes('PEC')) return 'pecs';
    
    const texto = normalize(projeto.ementa);
    if (texto.match(/CRIME|PENA|POLICIA|SEGURANCA|ARMAS|PRESIDIO|DROGA|CORRUPCAO|LAVAGEM|PENAL|DETENCAO/)) return 'seguranca';
    if (texto.match(/IMPOSTO|TRIBUT|TAXA|ECONOMIA|GASTO|ORCAMENTO|PRIVATIZA|RECEITA|FISCAL|MOEDA|CREDITO|FINAN/)) return 'economia';
    if (texto.match(/EDUCA|ESCOLA|ENSINO|PROFESSOR|ALUNO|UNIVERSIDADE|CURRICULO|PEDAGOG/)) return 'educacao';
    if (texto.match(/SAUDE|HOSPITAL|MEDICO|REMEDIO|SUS|DOENCA|VACINA|ENFERME/)) return 'saude';
    return 'outros';
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Perfil
        const respPerfil = await fetch(`https://legis.senado.leg.br/dadosabertos/senador/${id}.json`);
        const dataPerfil = await respPerfil.json();
        const info = dataPerfil.DetalheParlamentar.Parlamentar;
        setSenador(info);

        // 2. Projetos (Autorias)
        const respAutorias = await fetch(`https://legis.senado.leg.br/dadosabertos/senador/${id}/autorias.json?ano=${anoSelecionado}`);
        const dataAutorias = await respAutorias.json();
        
        let listaProjetos = [];
        if (dataAutorias.MateriaAutoriaParlamentar?.Parlamentar?.Autorias?.Autoria) {
          const rawAutorias = forceArray(dataAutorias.MateriaAutoriaParlamentar.Parlamentar.Autorias.Autoria);
          listaProjetos = rawAutorias.map(a => ({
            id: a.Materia.CodigoMateria,
            siglaTipo: a.Materia.IdentificacaoMateria.SiglaSubtipoMateria,
            numero: a.Materia.IdentificacaoMateria.NumeroMateria,
            ano: a.Materia.IdentificacaoMateria.AnoMateria,
            ementa: a.Materia.EmentaMateria || "Sem ementa disponível."
          }));
        }

        // Categorização
        const tematicos = { seguranca: [], economia: [], educacao: [], saude: [], pecs: [], outros: [] };
        listaProjetos.forEach(proj => {
            const cat = categorizarProjeto(proj);
            if (tematicos[cat]) tematicos[cat].push(proj);
        });
        setProjetosTematicos(tematicos);
        setKpis(prev => ({ ...prev, totalProjetos: listaProjetos.length }));

        // 3. Gastos (Cotas)
        const respVerba = await fetch(`https://legis.senado.leg.br/dadosabertos/senador/${id}/verba/${anoSelecionado}.json`);
        const dataVerba = await respVerba.json();
        
        let listaGastos = [];
        if (dataVerba.VerbasIndenizatorias?.Parlamentar?.Verbas?.Verba) {
          listaGastos = forceArray(dataVerba.VerbasIndenizatorias.Parlamentar.Verbas.Verba);
        }

        // Agrupar gastos por tipo
        const gastosAgrupados = listaGastos.reduce((acc, g) => {
          const tipo = g.DescricaoDespesa;
          const valor = parseFloat(g.ValorReembolsado || 0);
          if (valor > 0) {
            if (!acc[tipo]) acc[tipo] = 0;
            acc[tipo] += valor;
          }
          return acc;
        }, {});

        const dadosGrafico = Object.entries(gastosAgrupados)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 6);

        setGraficoData(dadosGrafico);
        setTotalGastoPeriodo(Object.values(gastosAgrupados).reduce((a, b) => a + b, 0));

      } catch (error) {
        console.error("Erro dados senador:", error);
        toast({ title: "Erro de Dados", description: "Não foi possível carregar alguns dados do Senado.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, anoSelecionado, toast]);

  if (loading || !senador) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Carregando perfil do senador...</p>
      </div>
    );
  }

  const info = senador.IdentificacaoParlamentar;
  const ultimoMandato = forceArray(senador.Mandatos?.Mandato)[0];

  const openModal = (category) => {
    setModalCategory(category);
    setModalOpen(true);
  };

  return (
    <>
      <Helmet>
        <title>{info.NomeParlamentar} - FISCALIZA</title>
      </Helmet>

      <SimpleModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={`Projetos: ${modalCategory.toUpperCase()}`}>
        <div className="space-y-4">
            {projetosTematicos[modalCategory]?.map((proj, idx) => (
                <div key={`${proj.id}-${idx}`} className="pb-4 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                            {proj.siglaTipo} {proj.numero}/{proj.ano}
                        </span>
                        <a href={`https://www25.senado.leg.br/web/atividade/materias/-/materia/${proj.id}`} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-blue-600 flex items-center gap-1">
                            Ver detalhes <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                    <p className="text-sm text-gray-800">{proj.ementa}</p>
                </div>
            ))}
        </div>
      </SimpleModal>

      <div className="min-h-screen bg-gray-50 pb-20">
        {/* HEADER */}
        <div className="bg-white border-b shadow-sm pt-6 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link to="/senadores" className="text-gray-500 hover:text-blue-600 inline-flex items-center text-sm mb-6 font-medium">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Senadores
            </Link>

            <div className="flex flex-col md:flex-row gap-8">
                <div className="relative shrink-0 mx-auto md:mx-0">
                    <img 
                      src={info.UrlFotoParlamentar} 
                      alt={info.NomeParlamentar}
                      className="w-48 h-48 rounded-full object-cover border-4 border-white shadow-xl bg-gray-200"
                    />
                    <div className="absolute bottom-4 right-4 bg-green-500 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center text-white text-[10px] font-bold" title="Em Exercício">ON</div>
                </div>

                <div className="flex-1 w-full pt-2">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div>
                            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                                {info.NomeParlamentar}
                            </h1>
                            <div className="flex items-center gap-3 mt-2 text-lg text-gray-600">
                                <span className="font-bold text-blue-700">{info.SiglaPartidoParlamentar}</span>
                                <span className="h-1 w-1 rounded-full bg-gray-400"></span>
                                <span>{info.UfParlamentar}</span>
                            </div>
                            
                            {info.EmailParlamentar && (
                                <div className="mt-4 inline-flex items-center text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                                    <Mail className="w-4 h-4 mr-2 text-blue-500" /> {info.EmailParlamentar}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 flex gap-2">
                        {anosDisponiveis.map(ano => (
                            <button
                                key={ano}
                                onClick={() => setAnoSelecionado(ano)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                                    anoSelecionado === ano 
                                    ? 'bg-blue-600 text-white shadow-sm' 
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                                }`}
                            >
                                {ano}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* 1. PROJETOS */}
          <div className="mb-12">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                        <ScrollText className="w-7 h-7 mr-3 text-blue-600" /> Produção Legislativa
                    </h2>
                </div>
                
                <Tabs defaultValue="pecs" className="w-full">
                    <TabsList className="w-full justify-start h-auto p-1 bg-gray-100 flex-wrap gap-1 mb-6 rounded-xl">
                        <TabsTrigger value="pecs" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white gap-2 font-bold px-4">
                            <PenTool className="w-4 h-4" /> PECs ({projetosTematicos.pecs.length})
                        </TabsTrigger>
                        <TabsTrigger value="seguranca" className="gap-2"><Shield className="w-4 h-4" /> Segurança ({projetosTematicos.seguranca.length})</TabsTrigger>
                        <TabsTrigger value="economia" className="gap-2"><Banknote className="w-4 h-4" /> Economia ({projetosTematicos.economia.length})</TabsTrigger>
                        <TabsTrigger value="educacao" className="gap-2"><GraduationCap className="w-4 h-4" /> Educação ({projetosTematicos.educacao.length})</TabsTrigger>
                        <TabsTrigger value="saude" className="gap-2"><HeartPulse className="w-4 h-4" /> Saúde ({projetosTematicos.saude.length})</TabsTrigger>
                        <TabsTrigger value="outros" className="gap-2">Outros ({projetosTematicos.outros.length})</TabsTrigger>
                    </TabsList>

                    {['pecs', 'seguranca', 'economia', 'educacao', 'saude', 'outros'].map((key) => (
                        <TabsContent key={key} value={key} className="space-y-4 focus:outline-none">
                            <ProjectList lista={projetosTematicos[key]} />
                            {projetosTematicos[key].length > 3 && (
                                <Button variant="outline" className="w-full py-6 text-blue-600 border-blue-200 hover:bg-blue-50 font-semibold" onClick={() => openModal(key)}>
                                    Ver todas as {projetosTematicos[key].length} proposições
                                </Button>
                            )}
                        </TabsContent>
                    ))}
                </Tabs>
          </div>

          {/* 2. GASTOS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
             <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                        <Wallet className="w-7 h-7 mr-3 text-blue-600" /> Gastos Indenizatórios
                    </h2>
                </div>

                <Card className="border-gray-200 shadow-sm mb-6">
                    <CardContent className="h-[300px] pt-6">
                        {graficoData.length > 0 ? (
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={graficoData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={150} tick={{fontSize: 11}} interval={0}/>
                                    <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} cursor={{fill: 'transparent'}} />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                        {graficoData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#2563eb' : '#60a5fa'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">Sem dados de gastos para este ano.</div>
                        )}
                    </CardContent>
                    <div className="bg-gray-50 p-4 border-t text-center">
                        <p className="text-xs text-gray-500 uppercase font-bold">Total Acumulado ({anoSelecionado})</p>
                        <p className="text-2xl font-black text-gray-900">R$ {totalGastoPeriodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                </Card>
             </div>

             {/* Coluna Lateral */}
             <div className="space-y-6">
                <AdBanner title="Parceiro Oficial" />
                
                <Card>
                    <div className="p-6">
                        <h3 className="font-bold text-lg mb-4 flex items-center"><Building className="w-5 h-5 mr-2 text-gray-500"/> Detalhes do Mandato</h3>
                        <div className="space-y-3 text-sm text-gray-600">
                            <p><strong>Nome Civil:</strong> {info.NomeCompletoParlamentar}</p>
                            <p><strong>Início:</strong> {ultimoMandato?.QuintaLegislaturaInicio}</p>
                            <p><strong>Fim:</strong> {ultimoMandato?.QuintaLegislaturaFinal}</p>
                            <p><strong>Participação:</strong> {ultimoMandato?.DescricaoParticipacao}</p>
                        </div>
                        <a href={info.UrlPaginaParlamentar} target="_blank" rel="noopener noreferrer" className="mt-6 block">
                            <Button variant="outline" className="w-full">
                                Perfil Oficial no Senado <ExternalLink className="ml-2 w-3 h-3" />
                            </Button>
                        </a>
                    </div>
                </Card>
             </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default SenatorProfilePage;