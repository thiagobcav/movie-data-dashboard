
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart, RefreshCw, Wand2, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const PREMIUM_FEATURES = [
  {
    id: 'url-replacement',
    title: 'Substituição em Massa de URLs',
    description: 'Altere as URLs base dos seus conteúdos com facilidade e segurança.',
    icon: <RefreshCw className="h-8 w-8 text-primary" />,
    path: '/settings',
    tab: 'url-replacement',
    requiresPremium: true
  },
  {
    id: 'episode-url-replacement',
    title: 'Substituição de URLs em Episódios',
    description: 'Altere as URLs base dos episódios em lote para manter sua biblioteca atualizada.',
    icon: <RefreshCw className="h-8 w-8 text-primary" />,
    path: '/settings',
    tab: 'url-replacement',
    requiresPremium: true
  },
  {
    id: 'statistics',
    title: 'Estatísticas Avançadas',
    description: 'Visualize métricas detalhadas sobre o uso da sua plataforma.',
    icon: <BarChart className="h-8 w-8 text-primary" />,
    path: '/statistics',
    available: false,
    requiresPremium: true
  },
  {
    id: 'ai-tools',
    title: 'Ferramentas de IA',
    description: 'Use inteligência artificial para otimizar seu conteúdo automaticamente.',
    icon: <Wand2 className="h-8 w-8 text-primary" />,
    path: '/ai-tools',
    available: false,
    requiresPremium: true
  }
];

const PremiumFeatures = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPremium = user?.Premium === true;
  
  const handleNavigate = (feature: any) => {
    if (!feature.available && feature.available !== undefined) {
      return;
    }
    
    if (feature.requiresPremium && !isPremium) {
      navigate('/premium');
      return;
    }
    
    if (feature.tab) {
      navigate(`${feature.path}?tab=${feature.tab}`);
    } else {
      navigate(feature.path);
    }
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Recursos Premium</h1>
            <p className="text-muted-foreground">
              Acesse ferramentas avançadas para gerenciar sua plataforma
            </p>
          </div>
          
          {!isPremium && (
            <Button 
              onClick={() => navigate('/premium')}
              className="gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Assinar Premium
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PREMIUM_FEATURES.map((feature) => {
            const isFeatureAvailable = (feature.available !== false) && 
                                      (!feature.requiresPremium || isPremium);
                                      
            return (
              <Card 
                key={feature.id} 
                className={!isFeatureAvailable ? "opacity-70" : ""}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    {feature.icon}
                    {!isFeatureAvailable && (
                      feature.requiresPremium && !isPremium ? (
                        <div className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 text-xs px-2 py-1 rounded-full">
                          Premium
                        </div>
                      ) : (
                        <div className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 text-xs px-2 py-1 rounded-full">
                          Em breve
                        </div>
                      )
                    )}
                  </div>
                  <CardTitle className="mt-4">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button 
                    variant={isFeatureAvailable ? "default" : "outline"} 
                    className="w-full mt-2 gap-2"
                    onClick={() => handleNavigate(feature)}
                    disabled={feature.available === false}
                  >
                    {feature.requiresPremium && !isPremium 
                      ? "Requer Premium" 
                      : (feature.available === false 
                        ? "Indisponível" 
                        : "Acessar recurso")}
                    {isFeatureAvailable && <ArrowRight className="h-4 w-4" />}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PremiumFeatures;
