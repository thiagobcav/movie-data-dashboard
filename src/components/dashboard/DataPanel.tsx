
import React from 'react';
import DataCard from '@/components/ui/DataCard';
import { Film, Tv, Image, Bookmark, Users, Layers, Server } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DataPanelProps {
  stats: {
    contents: number;
    episodes: number;
    banners: number;
    categories: number;
    users: number;
    sessions: number;
    platforms: number;
  };
}

const DataPanel: React.FC<DataPanelProps> = ({ stats }) => {
  const navigate = useNavigate();

  const cards = [
    {
      title: 'Total de Conteúdos',
      value: stats.contents,
      icon: <Film size={18} />,
      path: '/contents',
    },
    {
      title: 'Total de Episódios',
      value: stats.episodes,
      icon: <Tv size={18} />,
      path: '/episodes',
    },
    {
      title: 'Total de Banners',
      value: stats.banners,
      icon: <Image size={18} />,
      path: '/banners',
    },
    {
      title: 'Total de Categorias',
      value: stats.categories,
      icon: <Bookmark size={18} />,
      path: '/categories',
    },
    {
      title: 'Total de Usuários',
      value: stats.users,
      icon: <Users size={18} />,
      path: '/users',
    },
    {
      title: 'Total de Sessões',
      value: stats.sessions,
      icon: <Layers size={18} />,
      path: '/sessions',
    },
    {
      title: 'Total de Plataformas',
      value: stats.platforms,
      icon: <Server size={18} />,
      path: '/platforms',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 staggered-fade-in">
      {cards.map((card, index) => (
        <DataCard
          key={index}
          title={card.title}
          value={card.value}
          icon={card.icon}
          onClick={() => navigate(card.path)}
        />
      ))}
    </div>
  );
};

export default DataPanel;
