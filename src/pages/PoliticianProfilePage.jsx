import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart2, FileText, Wallet, Vote, Globe, Twitter, Instagram } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const PoliticianProfilePage = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('desempenho');

  const politician = {
    id: 1,
    name: 'Kim Kataguiri',
    party: 'UNIÃO',
    state: 'SP',
    photo: 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=200&h=200&fit=crop&crop=face',
    social: {
      website: '#',
      twitter: '#',
      instagram: '#',
    },
    kpis: {
      eficacia: 85,
      responsabilidade: 92,
      lealdade: 65,
      presenca: 98,
    },
  };

  const tabs = [
    { id: 'desempenho', label: 'Painel de Desempenho', icon: BarChart2 },
    { id: 'atividade', label: 'Atividade Legislativa', icon: FileText },
    { id: 'despesas', label: 'Despesas (CEAP)', icon: Wallet },
    { id: 'votacoes', label: 'Votações', icon: Vote },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'desempenho':
        return <PerformancePanel kpis={politician.kpis} />;
      default:
        return <div className="text-center py-12 text-gray-500">Em breve...</div>;
    }
  };

  useEffect(() => {
    if (activeTab !== 'desempenho') {
      toast({
        title: "🚧 Conteúdo em desenvolvimento",
        description: `Esta aba ainda não foi implementada. Você pode solicitar no próximo prompt! 🚀`,
      });
    }
  }, [activeTab, toast]);

  return (
    <>
      <Helmet>
        <title>{politician.name} - Perfil - Fiscaliza, MBL!</title>
        <meta name="description" content={`Perfil completo de ${politician.name}, incluindo desempenho, despesas e votações.`} />
      </Helmet>

      <div className="bg-gray-50">
        {/* Profile Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row items-center bg-white p-6 rounded-lg shadow-md border border-gray-200"
          >
            <img  class="w-32 h-32 rounded-full object-cover border-4 border-yellow-400" alt={`Foto de ${politician.name}`} src="https://images.unsplash.com/photo-1580128660010-fd027e1e587a" />
            <div className="md:ml-6 mt-4 md:mt-0 text-center md:text-left">
              <h1 className="text-3xl font-extrabold text-gray-900">{politician.name}</h1>
              <p className="text-xl text-gray-600">{politician.party}/{politician.state}</p>
              <div className="flex justify-center md:justify-start space-x-4 mt-2">
                <a href={politician.social.website} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-yellow-500"><Globe /></a>
                <a href={politician.social.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-yellow-500"><Twitter /></a>
                <a href={politician.social.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-yellow-500"><Instagram /></a>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="sticky top-20 bg-white z-40 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-1 md:space-x-4 overflow-x-auto">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-shrink-0 flex items-center space-x-2 px-3 py-3 text-sm md:text-base font-medium border-b-4 transition-colors ${
                      activeTab === tab.id
                        ? 'border-yellow-400 text-yellow-500'
                        : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {renderContent()}
          </motion.div>
        </div>
      </div>
    </>
  );
};

const PerformancePanel = ({ kpis }) => {
  const kpiData = [
    { label: 'Eficácia Legislativa', value: kpis.eficacia, color: 'text-blue-500' },
    { label: 'Responsabilidade Fiscal', value: kpis.responsabilidade, color: 'text-green-500' },
    { label: 'Lealdade Partidária', value: kpis.lealdade, color: 'text-purple-500' },
    { label: 'Presença e Participação', value: kpis.presenca, color: 'text-orange-500' },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Painel de Desempenho Parlamentar</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map(kpi => (
          <div key={kpi.label} className="bg-gray-50 p-4 rounded-lg text-center border border-gray-200">
            <div className="relative w-32 h-32 mx-auto">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path
                  className="text-gray-200"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className={kpi.color}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${kpi.value}, 100`}
                />
              </svg>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</span>
                <span className="text-gray-500 text-sm">/100</span>
              </div>
            </div>
            <h3 className="mt-4 font-semibold text-gray-800">{kpi.label}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PoliticianProfilePage;