import React from 'react';
import GeneralCategoryPage from '../components/common/GeneralCategoryPage';
import { Facebook } from 'lucide-react';

const FacebookPage: React.FC = () => {
  return (
    <GeneralCategoryPage 
      title="Facebook Ads & Monetização"
      subtitle="Escalando ganhos com tráfego e conteúdo"
      icon={Facebook}
      category="Facebook Monetização"
      description="Aprenda a monetizar páginas, criar anúncios de alta conversão e utilizar IA para automatizar sua produção de conteúdo no ecossistema Meta."
      gradient="bg-gradient-to-br from-blue-700 to-blue-900"
    />
  );
};

export default FacebookPage;
