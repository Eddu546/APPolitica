import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Mail, MapPin, ExternalLink, 
  Loader2, ScrollText, PenTool, CheckCircle2, 
  Shield, GraduationCap, Banknote, HeartPulse, X, Award, Users,
  Building, PiggyBank, Car, Wallet, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import AdBanner from '@/components/AdBanner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { calculateDeputadoAssiduity, filterComplexProjects } from '@/lib/legislative-logic';

// --- COMPONENTES AUXILIARES ---

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
    {lista.slice(0, 3).map((proj) => (
      <div key={proj.id} className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:border-blue-300 transition-all group">
          <div className="flex justify-between items-start gap-2 mb-2">
              <span className="text-[11px] uppercase font-bold px-2 py-1 rounded bg-slate-100 text-slate-700">
                  {proj.siglaTipo} {proj.numero}/{proj.ano}
              </span>
              <a href={`https://www.camara.leg.br/propostas-legislativas/${proj.id}`} target="_blank" rel="noopener noreferrer">
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

const PoliticianProfilePage = () => {
  const { id } = useParams();
  const { toast } = useToast();
  
  // Estados
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear().toString());
  const [mesSelecionado, setMesSelecionado] = useState('Todos');
  const [politico, setPolitico] = useState(null);
  
  // Dados processados
  const [projetosTematicos, setProjetosTematicos] = useState({
    seguranca: [], economia: [], educacao: [], saude: [], pecs: [], outros: []
  });
  const [projetosComplexos, setProjetosComplexos] = useState([]);
  
  const [todasDespesas, setTodasDespesas] = useState([]); 
  const [despesasFiltradas, setDespesasFiltradas] = useState([]); 
  const [graficoData, setGraficoData] = useState([]);
  const [totalGastoPeriodo, setTotalGastoPeriodo] = useState(0);

  const [kpis, setKpis] = useState({ totalPL: 0, totalPEC: 0 });
  const [presenca, setPresenca] = useState({ score: 0, label: '-', description: '' });

  const [analiseGastos, setAnaliseGastos] = useState({
    usaCarro: false, 
    usaDivulgacao: false, 
    recebeAuxilioMoradia: false
  });
  
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState('outros');

  const anosDisponiveis = ['2023', '2024', '2025', 'Todos'];
  const mesesDisponiveis = [
    { val: 'Todos', label: 'Todos os Meses' },
    { val: 1, label: 'Janeiro' }, { val: 2, label: 'Fevereiro' }, { val: 3, label: 'Março' },
    { val: 4, label: 'Abril' }, { val: 5, label: 'Maio' }, { val: 6, label: 'Junho' },
    { val: 7, label: 'Julho' }, { val: 8, label: 'Agosto' }, { val: 9, label: 'Setembro' },
    { val: 10, label: 'Outubro' }, { val: 11, label: 'Novembro' }, { val: 12, label: 'Dezembro' }
  ];

  const normalize = (text) => text ? text.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";

  const categorizarProjeto = (projeto) => {
    if (projeto.siglaTipo === 'PEC' || projeto.siglaTipo === 'PEC ') return 'pecs';
    const texto = normalize(projeto.ementa);
    if (texto.match(/CRIME|PENA|POLICIA|SEGURANCA|ARMAS|PRESIDIO|DROGA|CORRUPCAO|LAVAGEM|PENAL|DETENCAO/)) return 'seguranca';
    if (texto.match(/IMPOSTO|TRIBUT|TAXA|ECONOMIA|GASTO|ORCAMENTO|PRIVATIZA|RECEITA|FISCAL|MOEDA|CREDITO|FINAN/)) return 'economia';
    if (texto.match(/EDUCA|ESCOLA|ENSINO|PROFESSOR|ALUNO|UNIVERSIDADE|CURRICULO|PEDAGOG/)) return 'educacao';
    if (texto.match(/SAUDE|HOSPITAL|MEDICO|REMEDIO|SUS|DOENCA|VACINA|ENFERME/)) return 'saude';
    return 'outros';
  };

  const fetchAllPages = async (urlBase) => {
    let allData = [];
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      try {
        const separator = urlBase.includes('?') ? '&' : '?';
        const res = await fetch(`${urlBase}${separator}pagina=${page}&itens=100`, {
            headers: {
                'Accept': 'application/json'
            }
        });
        if (!res.ok) throw new Error('API Error');
        
        const json = await res.json();
        if (json.dados && json.dados.length > 0) {
          allData = [...allData, ...json.dados];
          page++;
          if (json.dados.length < 100) hasMore = false;
        } else {
          hasMore = false;
        }
      } catch (e) {
        console.warn('Fetch error:', e);
        hasMore = false;
      }
    }
    return allData;
  };

  const fetchProjetosPorAno = async (ano, tipo) => {
    try {
      await new Promise(r => setTimeout(r, 100)); // Rate limit prevention
      const res = await fetch(`https://dadosabertos.camara.leg.br/api/v2/proposicoes?idDeputadoAutor=${id}&siglaTipo=${tipo}&ano=${ano}&itens=500&ordem=DESC&ordenarPor=id`, {
          headers: { 'Accept': 'application/json' }
      });
      const json = await res.json();
      return json.dados || [];
    } catch (e) {
      return [];
    }
  };

  // 1. Carrega Dados Estáticos (Perfil)
  useEffect(() => {
    const fetchPerfil = async () => {
      if (!id) return;
      try {
        const respInfo = await fetch(`https://dadosabertos.camara.leg.br/api/v2/deputados/${id}`, {
            headers: { 'Accept': 'application/json' }
        });
        const dataInfo = await respInfo.json();
        setPolitico(dataInfo.dados);
      } catch (error) {
        console.error("Erro perfil:", error);
      }
    };
    fetchPerfil();
  }, [id]);

  // 2. Carrega Dados Dinâmicos
  useEffect(() => {
    const fetchDadosDinamicos = async () => {
      if (!id) return;
      setLoading(false);

      try {
        let listaPL = [];
        let listaPEC = [];
        let listaDespesas = [];
        let listaEventos = [];

        const anosParaBuscar = anoSelecionado === 'Todos' ? [2023, 2024, 2025] : [parseInt(anoSelecionado)];

        for (const ano of anosParaBuscar) {
            // Projetos
            const pl = await fetchProjetosPorAno(ano, 'PL');
            listaPL = [...listaPL, ...pl];
            const pec = await fetchProjetosPorAno(ano, 'PEC');
            listaPEC = [...listaPEC, ...pec];
            
            // Despesas
            const despesasUrl = `https://dadosabertos.camara.leg.br/api/v2/deputados/${id}/despesas?ano=${ano}&ordem=DESC&ordenarPor=dataDocumento`;
            const despesasAno = await fetchAllPages(despesasUrl);
            listaDespesas = [...listaDespesas, ...despesasAno];

            // Eventos (Assiduidade) - Trocado de Votacoes para Eventos (mais leve e seguro)
            const eventosUrl = `https://dadosabertos.camara.leg.br/api/v2/deputados/${id}/eventos?dataInicio=${ano}-01-01&dataFim=${ano}-12-31&ordem=ASC&ordenarPor=dataHoraInicio`;
            const eventosAno = await fetchAllPages(eventosUrl);
            listaEventos = [...listaEventos, ...eventosAno];
        }

        // --- PROCESSAMENTO ---
        
        // 1. Assiduidade (Baseada em Eventos)
        const assiduidadeData = calculateDeputadoAssiduity(listaEventos);
        setPresenca(assiduidadeData);

        // 2. Projetos Complexos
        const todosProjetos = [...listaPL, ...listaPEC];
        const complexos = filterComplexProjects(todosProjetos);
        setProjetosComplexos(complexos);

        // 3. Categorização Temática
        const tematicos = { seguranca: [], economia: [], educacao: [], saude: [], pecs: [], outros: [] };
        todosProjetos.forEach(proj => {
            const cat = categorizarProjeto(proj);
            if (tematicos[cat]) tematicos[cat].push(proj);
        });
        
        setProjetosTematicos(tematicos);
        setKpis({
            totalPL: listaPL.length,
            totalPEC: listaPEC.length
        });

        setTodasDespesas(listaDespesas);

        // Auditoria
        let usaCarro = false;
        let usaDivulgacao = false;
        let recebeAuxilioMoradia = false;

        listaDespesas.forEach(d => {
            const tipo = normalize(d.tipoDespesa);
            if (tipo.includes("VEICULO") || tipo.includes("AUTOMOTOR") || tipo.includes("FRETAMENTO") || tipo.includes("COMBUSTIVEL")) usaCarro = true;
            if (tipo.includes("DIVULGACAO")) usaDivulgacao = true;
            if (tipo.includes("MORADIA") || tipo.includes("ALUGUEL")) recebeAuxilioMoradia = true;
        });

        setAnaliseGastos({ usaCarro, usaDivulgacao, recebeAuxilioMoradia });

      } catch (error) {
        console.error("Erro dados:", error);
        toast({ title: "Erro na API", description: "Falha ao carregar dados complementares.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    if (politico) fetchDadosDinamicos();
  }, [id, anoSelecionado, politico, toast]);

  // 3. Filtragem Local
  useEffect(() => {
    if (todasDespesas.length === 0) {
        setDespesasFiltradas([]);
        setGraficoData([]);
        setTotalGastoPeriodo(0);
        return;
    }

    const filtradas = todasDespesas.filter(d => {
        if (mesSelecionado === 'Todos') return true;
        return d.mes === parseInt(mesSelecionado);
    });

    setDespesasFiltradas(filtradas);
    const total = filtradas.reduce((acc, d) => acc + d.valorLiquido, 0);
    setTotalGastoPeriodo(total);

    const agrupado = filtradas.reduce((acc, curr) => {
        const tipo = curr.tipoDespesa;
        const valor = curr.valorLiquido;
        if (valor > 0) {
            if (!acc[tipo]) acc[tipo] = 0;
            acc[tipo] += valor;
        }
        return acc;
    }, {});

    const dadosGrafico = Object.entries(agrupado)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);
    
    setGraficoData(dadosGrafico);
  }, [todasDespesas, mesSelecionado]);

  if (loading || !politico) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Analisando histórico parlamentar...</p>
      </div>
    );
  }

  const info = politico.ultimoStatus || politico;

  const openModal = (category) => {
    setModalCategory(category);
    setModalOpen(true);
  };

  return (
    <>
      <Helmet>
        <title>{info.nomeEleitoral} - FISCALIZA</title>
      </Helmet>

      <SimpleModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={`Todos os Projetos: ${modalCategory.toUpperCase()}`}>
        <div className="space-y-4">
            {projetosTematicos[modalCategory]?.map((proj) => (
                <div key={proj.id} className="pb-4 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                            {proj.siglaTipo} {proj.numero}/{proj.ano}
                        </span>
                        <a href={`https://www.camara.leg.br/propostas-legislativas/${proj.id}`} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-blue-600 flex items-center gap-1">
                            Ver íntegra <ExternalLink className="w-3 h-3" />
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
            <Link to="/deputados" className="text-gray-500 hover:text-blue-600 inline-flex items-center text-sm mb-6 font-medium">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Deputados
            </Link>

            <div className="flex flex-col md:flex-row gap-8">
                <div className="relative shrink-0 mx-auto md:mx-0">
                    <img 
                      src={info.urlFoto} 
                      alt={info.nomeEleitoral}
                      className="w-48 h-48 rounded-full object-cover border-4 border-white shadow-xl bg-gray-200"
                    />
                    <div className="absolute bottom-4 right-4 bg-green-500 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center text-white text-[10px] font-bold" title="Ativo">ON</div>
                </div>

                <div className="flex-1 w-full pt-2">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div>
                            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                                {info.nomeEleitoral}
                            </h1>
                            <div className="flex items-center gap-3 mt-2 text-lg text-gray-600">
                                <span className="font-bold text-blue-700">{info.siglaPartido}</span>
                                <span className="h-1 w-1 rounded-full bg-gray-400"></span>
                                <span>{info.siglaUf}</span>
                            </div>
                            
                            <div className="mt-4 flex flex-wrap gap-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${!analiseGastos.usaCarro ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                    {!analiseGastos.usaCarro ? <CheckCircle2 className="w-3 h-3 mr-1"/> : <Car className="w-3 h-3 mr-1"/>}
                                    {!analiseGastos.usaCarro ? 'Sem aluguel de carro' : 'Usa verba transporte'}
                                </span>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${!analiseGastos.usaDivulgacao ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                    {!analiseGastos.usaDivulgacao ? <CheckCircle2 className="w-3 h-3 mr-1"/> : <Award className="w-3 h-3 mr-1"/>}
                                    {!analiseGastos.usaDivulgacao ? 'Zero autopromoção' : 'Gasta com divulgação'}
                                </span>
                            </div>
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
          
          {/* 1. KEY METRICS CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Card className="border-blue-200 bg-blue-50/50">
                    <CardContent className="p-4">
                        <div className="text-xs font-bold text-blue-600 uppercase mb-1">Atividade Parlamentar</div>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-black text-gray-900">{presenca.score}</span>
                            <span className="text-xs text-gray-500 mb-1">{presenca.label}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1">{presenca.description}</div>
                    </CardContent>
                </Card>
                <Card className="border-purple-200 bg-purple-50/50">
                    <CardContent className="p-4">
                        <div className="text-xs font-bold text-purple-600 uppercase mb-1">Propostas de Lei</div>
                        <div className="text-3xl font-black text-gray-900">{kpis.totalPL}</div>
                        <div className="text-[10px] text-gray-500">Autoria em {anoSelecionado}</div>
                    </CardContent>
                </Card>
                <Card className="border-amber-200 bg-amber-50/50">
                    <CardContent className="p-4">
                        <div className="text-xs font-bold text-amber-600 uppercase mb-1">PECs / PLPs</div>
                        <div className="text-3xl font-black text-gray-900">{kpis.totalPEC}</div>
                        <div className="text-[10px] text-gray-500">Projetos estruturais</div>
                    </CardContent>
                </Card>
                <Card className="border-green-200 bg-green-50/50">
                    <CardContent className="p-4">
                        <div className="text-xs font-bold text-green-600 uppercase mb-1">Custo Mensal Médio</div>
                        <div className="text-xl font-black text-gray-900">R$ {totalGastoPeriodo > 0 ? (totalGastoPeriodo / (mesSelecionado === 'Todos' ? 12 : 1)).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) : '0'}</div>
                        <div className="text-[10px] text-gray-500">Verba utilizada</div>
                    </CardContent>
                </Card>
          </div>

          {/* 2. DESTAQUES: PROJETOS COMPLEXOS */}
          {projetosComplexos.length > 0 && (
            <div className="mb-8">
                <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
                    <Star className="w-5 h-5 text-yellow-500 mr-2 fill-yellow-500" /> Últimos Movimentos Complexos
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                    {projetosComplexos.slice(0, 2).map((proj) => (
                        <Card key={proj.id} className="border-yellow-200 bg-yellow-50/30">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                        {proj.siglaTipo} {proj.numero}/{proj.ano}
                                    </span>
                                    <span className="text-xs text-gray-400">{new Date().getFullYear()}</span>
                                </div>
                                <p className="text-sm font-medium text-gray-800 line-clamp-3">{proj.ementa}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
          )}

          {/* 3. LISTAS DE PROJETOS (TABS) */}
          <div className="mb-12">
                <Tabs defaultValue="seguranca" className="w-full">
                    <TabsList className="w-full justify-start h-auto p-1 bg-gray-100 flex-wrap gap-1 mb-6 rounded-xl">
                        <TabsTrigger value="seguranca" className="gap-2"><Shield className="w-4 h-4" /> Segurança ({projetosTematicos.seguranca.length})</TabsTrigger>
                        <TabsTrigger value="economia" className="gap-2"><Banknote className="w-4 h-4" /> Economia ({projetosTematicos.economia.length})</TabsTrigger>
                        <TabsTrigger value="educacao" className="gap-2"><GraduationCap className="w-4 h-4" /> Educação ({projetosTematicos.educacao.length})</TabsTrigger>
                        <TabsTrigger value="saude" className="gap-2"><HeartPulse className="w-4 h-4" /> Saúde ({projetosTematicos.saude.length})</TabsTrigger>
                        <TabsTrigger value="pecs" className="gap-2"><PenTool className="w-4 h-4" /> PECs ({projetosTematicos.pecs.length})</TabsTrigger>
                    </TabsList>

                    {['seguranca', 'economia', 'educacao', 'saude', 'pecs'].map((key) => (
                        <TabsContent key={key} value={key} className="space-y-4 focus:outline-none">
                            <ProjectList lista={projetosTematicos[key]} />
                            {projetosTematicos[key].length > 3 && (
                                <Button variant="outline" className="w-full py-6 text-blue-600 border-blue-200 hover:bg-blue-50 font-semibold" onClick={() => openModal(key)}>
                                    Ver todos os {projetosTematicos[key].length} projetos
                                </Button>
                            )}
                        </TabsContent>
                    ))}
                </Tabs>
          </div>

          {/* 4. GASTOS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
             <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                        <Wallet className="w-7 h-7 mr-3 text-blue-600" /> Detalhamento de Gastos
                    </h2>
                    <select 
                        className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                        value={mesSelecionado}
                        onChange={(e) => setMesSelecionado(e.target.value)}
                    >
                        {mesesDisponiveis.map(m => (
                            <option key={m.val} value={m.val}>{m.label}</option>
                        ))}
                    </select>
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
                            <div className="h-full flex items-center justify-center text-gray-400">Sem dados para este período.</div>
                        )}
                    </CardContent>
                    <div className="bg-gray-50 p-4 border-t text-center">
                        <p className="text-xs text-gray-500 uppercase font-bold">Total Gasto ({mesSelecionado === 'Todos' ? 'Ano' : 'Mês'})</p>
                        <p className="text-2xl font-black text-gray-900">R$ {totalGastoPeriodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                </Card>

                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    <h3 className="font-bold text-gray-700 mb-2 px-1">Notas Fiscais Recentes</h3>
                    {despesasFiltradas.slice(0, 50).map((d, i) => (
                        <div key={i} className="flex justify-between items-center bg-white p-3 rounded border border-gray-100 text-sm hover:bg-gray-50">
                            <div>
                                <p className="font-bold text-gray-800">{d.tipoDespesa}</p>
                                <p className="text-xs text-gray-500">{d.nomeFornecedor} • {new Date(d.dataDocumento).toLocaleDateString('pt-BR')}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-mono font-bold text-gray-900">R$ {d.valorLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                {d.urlDocumento && (
                                    <a href={d.urlDocumento} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 hover:underline">
                                        Ver Nota Fiscal
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
             </div>

             <div className="space-y-6">
                <AdBanner title="Apoio Institucional" />
                
                <div className="bg-slate-900 text-white rounded-xl p-6 shadow-lg">
                    <div className="flex items-center gap-2 mb-4">
                        <Users className="text-blue-400 w-6 h-6" />
                        <h3 className="font-bold text-lg">Frentes Parlamentares</h3>
                    </div>
                    <div className="text-4xl font-extrabold text-blue-400 mb-1">{politico.totalFrentes || '...'}</div>
                    <p className="text-slate-400 text-sm mb-4">Participações ativas</p>
                    <p className="text-xs text-slate-500">Grupos suprapartidários que defendem causas específicas.</p>
                </div>

                <div className="bg-orange-50 border border-orange-100 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <PiggyBank className="w-6 h-6 text-orange-600" />
                        <h3 className="font-bold text-orange-900">Emendas</h3>
                    </div>
                    <p className="text-sm text-orange-800 mb-4">
                        Veja para onde o deputado enviou recursos públicos.
                    </p>
                    <a href={`http://www.portaltransparencia.gov.br/busca?termo=${info.nomeEleitoral}`} target="_blank" rel="noopener noreferrer">
                        <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                            Portal da Transparência <ExternalLink className="ml-2 w-4 h-4" />
                        </Button>
                    </a>
                </div>
             </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default PoliticianProfilePage;