/**
 * LEGISLATIVE LOGIC ENGINE (v2.3 - Fix Assiduidade Simplificada)
 * Centraliza o cálculo de KPIs e regras de negócio para Deputados e Senadores.
 */

// --- CONSTANTES E PESOS ---

const COMPLEX_PROJECT_KEYWORDS = /(CÓDIGO|REFORMA|DIRETRIZES NACIONAIS|ESTATUTO|MARCO LEGAL|PEC|PLP|LEI COMPLEMENTAR|SISTEMA NACIONAL|POLÍTICA NACIONAL)/i;

const SENATOR_WEIGHTS = {
  RELATORIA_PEC: 10,
  RELATORIA_PL: 5,
  RELATORIA_OUTROS: 1,
  COMISSAO_TITULAR: 100,
  COMISSAO_SUPLENTE: 50,
  COMISSAO_PRESIDENTE_BONUS: 50
};

const STRATEGIC_COMMISSIONS = ['CCJ', 'CAE'];

// --- UTILITÁRIOS ---

export const normalizeText = (text) => {
  return text ? text.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
};

export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

// --- MÓDULO 1: DEPUTADOS FEDERAIS ---

/**
 * Calcula a Presença em Plenário baseada em eventos registrados.
 * LÓGICA SIMPLIFICADA: A API de eventos do deputado lista onde ele esteve ativo.
 * Contamos sessões deliberativas como proxy de assiduidade.
 * @param {Array} eventos - Lista de eventos da API da Câmara.
 * @returns {Object} { score: number (count), label: string, description: string }
 */
export const calculateDeputadoAssiduity = (eventos) => {
  if (!eventos || eventos.length === 0) {
    return { score: 0, label: 'Sem dados', description: 'Aguardando dados oficiais...' };
  }

  // Filtra sessões de plenário ou comissões (atividades principais)
  const atividadesRelevantes = eventos.filter(e => {
    const tipo = (e.descricaoTipo || '').toUpperCase();
    // Consideramos Sessões, Reuniões de Comissão e Audiências
    return tipo.includes('SESSÃO') || tipo.includes('REUNIÃO') || tipo.includes('AUDIÊNCIA');
  });

  const totalAtividades = atividadesRelevantes.length;

  let label = 'Baixa';
  if (totalAtividades > 100) label = 'Alta';
  else if (totalAtividades > 50) label = 'Média';

  return {
    score: totalAtividades,
    label,
    description: 'Atividades registradas (Sessões/Comissões)'
  };
};

/**
 * Filtra projetos complexos baseados em palavras-chave.
 * @param {Array} proposicoes - Lista de projetos.
 * @returns {Array} Projetos filtrados e ordenados.
 */
export const filterComplexProjects = (proposicoes) => {
  if (!proposicoes) return [];
  
  return proposicoes
    .filter(proj => {
      const ementa = normalizeText(proj.ementa);
      const tipo = proj.siglaTipo;
      // PECs e PLPs são complexos por natureza
      if (['PEC', 'PLP'].includes(tipo)) return true;
      // PLs dependem do conteúdo
      return COMPLEX_PROJECT_KEYWORDS.test(ementa);
    })
    .sort((a, b) => b.ano - a.ano) // Mais recentes primeiro
    .slice(0, 5); // Retorna top 5
};

// --- MÓDULO 2: SENADORES ---

/**
 * Calcula Score de Relatoria (O Revisor).
 * @param {Array} relatorias - Lista de matérias relatadas.
 * @returns {Object} { score: number, resumo: string }
 */
export const calculateSenatorRelatorScore = (relatorias) => {
  if (!relatorias || relatorias.length === 0) return { score: 0, resumo: 'Nenhuma relatoria' };

  let score = 0;
  let qtdPEC = 0;
  let qtdPL = 0;

  relatorias.forEach(materia => {
    const tipo = materia.siglaTipo; 
    if (tipo === 'PEC') {
      score += SENATOR_WEIGHTS.RELATORIA_PEC;
      qtdPEC++;
    } else if (['PL', 'PLC', 'PLS'].includes(tipo)) {
      score += SENATOR_WEIGHTS.RELATORIA_PL;
      qtdPL++;
    } else {
      score += SENATOR_WEIGHTS.RELATORIA_OUTROS;
    }
  });

  return {
    score,
    resumo: `${qtdPEC} PECs, ${qtdPL} Projetos de Lei relatados`
  };
};

/**
 * Verifica participação em comissões estratégicas (CCJ/CAE).
 * @param {Array} comissoes - Lista de comissões do parlamentar.
 * @returns {Object} { score: number, papeis: Array<string> }
 */
export const checkStrategicCommissions = (comissoes) => {
  if (!comissoes) return { score: 0, papeis: [] };

  let score = 0;
  const papeis = [];

  comissoes.forEach(com => {
    const nome = normalizeText(com.nomeComissao || com.siglaComissao);
    const cargo = normalizeText(com.descricaoParticipacao || '');

    const isStrategic = STRATEGIC_COMMISSIONS.some(sigla => nome.includes(sigla));

    if (isStrategic) {
      let pts = 0;
      if (cargo.includes('TITULAR')) pts = SENATOR_WEIGHTS.COMISSAO_TITULAR;
      if (cargo.includes('SUPLENTE')) pts = SENATOR_WEIGHTS.COMISSAO_SUPLENTE;
      
      if (cargo.includes('PRESIDENTE')) pts += SENATOR_WEIGHTS.COMISSAO_PRESIDENTE_BONUS;

      if (pts > 0) {
        score += pts;
        papeis.push(`${com.siglaComissao} (${com.descricaoParticipacao})`);
      }
    }
  });

  return { score, papeis };
};

/**
 * Calcula Índice de Eficiência.
 */
export const calculateEfficiencyIndex = (gastoTotal, produtividadeScore) => {
  if (gastoTotal <= 0) return { indice: "N/A", raw: 0 };
  
  const custoNormalizado = gastoTotal / 100000;
  const indice = produtividadeScore / custoNormalizado;

  return {
    indice: indice.toFixed(1),
    raw: indice,
    interpretacao: indice > 10 ? 'Alta Eficiência' : indice > 5 ? 'Média' : 'Baixa'
  };
};