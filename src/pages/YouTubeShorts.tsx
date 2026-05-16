import React from 'react';
import GeneralCategoryPage from '../components/common/GeneralCategoryPage';
import { Youtube } from 'lucide-react';

const YouTubeShorts: React.FC = () => {
  return (
    <GeneralCategoryPage 
      title="YouTube Shorts"
      subtitle="Crescimento acelerado com vídeos curtos"
      icon={Youtube}
      category="YouTube Shorts"
      description="Templates de roteiros virais, análise de algoritmos e agentes de IA focados em criar ganchos poderosos para o YouTube Shorts."
      gradient="bg-gradient-to-br from-red-600 to-red-800"
    />
  );
};

export default YouTubeShorts;
