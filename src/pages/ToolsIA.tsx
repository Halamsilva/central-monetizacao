import React from 'react';
import GeneralCategoryPage from '../components/common/GeneralCategoryPage';
import { Wrench } from 'lucide-react';

const ToolsIA: React.FC = () => {
  return (
    <GeneralCategoryPage 
      title="Ferramentas IA"
      subtitle="Otimize seu fluxo de trabalho"
      icon={Wrench}
      category="IA para Conteúdo"
      description="Descubra e aprenda a usar as melhores IAs do mercado para edição de vídeo, criação de imagens, vozes neurais e automação completa."
      gradient="bg-gradient-to-br from-purple-600 to-indigo-800"
    />
  );
};

export default ToolsIA;
