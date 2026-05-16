import React from 'react';
import GeneralCategoryPage from '../components/common/GeneralCategoryPage';
import { ShoppingBag } from 'lucide-react';

const TikTokShop: React.FC = () => {
  return (
    <GeneralCategoryPage 
      title="TikTok Shop"
      subtitle="Domine as vendas no ecossistema do TikTok"
      icon={ShoppingBag}
      category="TikTok Shop"
      description="Estratégias validadas, roteiros persuasivos e agentes especializados para você vender produtos físicos todos os dias através do TikTok Shop."
      gradient="bg-gradient-to-br from-black via-zinc-900 to-zinc-800"
    />
  );
};

export default TikTokShop;
