
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search, Filter, Users, MapPin, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const DeputadosPage = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedParty, setSelectedParty] = useState('');

  // Mock data para demonstração
  const [deputados] = useState([
    {
      id: 1,
      nome: 'João Silva',
      partido: 'PT',
      estado: 'SP',
      foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      proposicoes: 45,
      presenca: 89,
      gastos: 'R$ 125.000'
    },
    {
      id: 2,
      nome: 'Maria Santos',
      partido: 'PSDB',
      estado: 'RJ',
      foto: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      proposicoes: 32,
      presenca: 92,
      gastos: 'R$ 98.500'
    },
    {
      id: 3,
      nome: 'Carlos Oliveira',
      partido: 'PL',
      estado: 'MG',
      foto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      proposicoes: 28,
      presenca: 85,
      gastos: 'R$ 110.200'
    },
    {
      id: 4,
      nome: 'Ana Costa',
      partido: 'PSOL',
      estado: 'BA',
      foto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      proposicoes: 52,
      presenca: 94,
      gastos: 'R$ 87.300'
    },
    {
      id: 5,
      nome: 'Roberto Lima',
      partido: 'MDB',
      estado: 'RS',
      foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      proposicoes: 38,
      presenca: 88,
      gastos: 'R$ 132.800'
    },
    {
      id: 6,
      nome: 'Fernanda Rocha',
      partido: 'PDT',
      estado: 'PR',
      foto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
      proposicoes: 41,
      presenca: 91,
      gastos: 'R$ 104.600'
    }
  ]);

  const estados = ['SP', 'RJ', 'MG', 'BA', 'RS', 'PR', 'SC', 'GO', 'PE', 'CE'];
  const partidos = ['PT', 'PSDB', 'PL', 'PSOL', 'MDB', 'PDT', 'PP', 'REPUBLICANOS', 'PSB', 'UNIÃO'];

  const filteredDeputados = deputados.filter(deputado => {
    const matchesSearch = deputado.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = selectedState === '' || deputado.estado === selectedState;
    const matchesParty = selectedParty === '' || deputado.partido === selectedParty;
    return matchesSearch && matchesState && matchesParty;
  });

  const handleDeputadoClick = (deputado) => {
    toast({
      title: "🚧 Perfil detalhado em desenvolvimento",
      description: `O perfil completo de ${deputado.nome} ainda não está implementado—mas não se preocupe! Você pode solicitar isso no seu próximo prompt! 🚀`,
    });
  };

  return (
    <>
      <Helmet>
        <title>Deputados Federais - CivicTech Brasil</title>
        <meta name="description" content="Explore o perfil completo dos 513 deputados federais brasileiros. Veja proposições, presença e gastos públicos de cada parlamentar." />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Deputados Federais
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Conheça os 513 deputados federais brasileiros e acompanhe suas atividades parlamentares em tempo real.
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar deputado..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* State Filter */}
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os Estados</option>
                {estados.map(estado => (
                  <option key={estado} value={estado}>{estado}</option>
                ))}
              </select>

              {/* Party Filter */}
              <select
                value={selectedParty}
                onChange={(e) => setSelectedParty(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os Partidos</option>
                {partidos.map(partido => (
                  <option key={partido} value={partido}>{partido}</option>
                ))}
              </select>

              {/* Clear Filters */}
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedState('');
                  setSelectedParty('');
                }}
                className="w-full"
              >
                <Filter className="w-4 h-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <p className="text-gray-600">
              Mostrando {filteredDeputados.length} de {deputados.length} deputados
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDeputados.map((deputado, index) => (
              <motion.div
                key={deputado.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer hover-lift"
                onClick={() => handleDeputadoClick(deputado)}
              >
                <div className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <img
                      src={deputado.foto}
                      alt={deputado.nome}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{deputado.nome}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">{deputado.partido}</span>
                        <span className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {deputado.estado}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{deputado.proposicoes}</div>
                      <div className="text-xs text-gray-600">Proposições</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{deputado.presenca}%</div>
                      <div className="text-xs text-gray-600">Presença</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-orange-600">{deputado.gastos}</div>
                      <div className="text-xs text-gray-600">Gastos</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredDeputados.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum deputado encontrado</h3>
              <p className="text-gray-600">Tente ajustar os filtros de busca.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DeputadosPage;
