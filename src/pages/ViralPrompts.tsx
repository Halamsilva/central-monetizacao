import React from 'react';
import GeneralCategoryPage from '../components/common/GeneralCategoryPage';
import { Zap } from 'lucide-react';

const ViralPrompts: React.FC = () => {
  return (
    <GeneralCategoryPage 
      title="Prompts Virais"
      subtitle="O segredo da retenção e do engajamento"
      icon={Zap}
      category="Prompts Virais"
      description="Uma coleção curada de ganchos (hooks) e estruturas de roteiros que forçam o algoritmo a entregar seu conteúdo para milhões de pessoas."
      gradient="bg-gradient-to-br from-amber-500 to-orange-700"
    />
  );
};

export default ViralPrompts;
