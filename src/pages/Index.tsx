
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataPanel from '@/components/dashboard/DataPanel';
import { useConfiguredApi } from '@/utils/configHelper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import BannerCarousel from '@/components/dashboard/BannerCarousel';

const BANNERS_API_URL = "https://api.baserow.io/api/database/rows/table/491626/?user_field_names=true";
const BANNERS_API_TOKEN = "9HJjNCWkRnJDxwYZHLYG9sHgLEu2Pbar";

const Index = () => {
  const navigate = useNavigate();
  const { config, api, isConfigured } = useConfiguredApi();
  const [isLoading, setIsLoading] = useState(true);
  const [banners, setBanners] = useState([]);
  const [stats, setStats] = useState({
    contents: 0,
    episodes: 0,
    banners: 0,
    categories: 0,
    users: 0,
    sessions: 0,
    platforms: 0,
  });

  const fetchBanners = async () => {
    try {
      const response = await fetch(BANNERS_API_URL, {
        headers: {
          'Authorization': `Token ${BANNERS_API_TOKEN}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching banners: ${response.status}`);
      }
      
      const data = await response.json();
      setBanners(data.results || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast.error('Erro ao carregar banners promocionais');
    }
  };

  const fetchStats = async () => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Fetch stats
      const statsPromises = Object.keys(stats).map(async (tableType) => {
        if (!config.tableIds[tableType as keyof typeof config.tableIds]) {
          return { tableType, count: 0 };
        }

        try {
          const response = await api.getTableRows(
            tableType as keyof typeof stats,
            1,
            1
          );
          return { tableType, count: response.count || 0 };
        } catch (error) {
          console.error(`Error fetching ${tableType} stats:`, error);
          return { tableType, count: 0 };
        }
      });

      const results = await Promise.all(statsPromises);
      
      const newStats = { ...stats };
      results.forEach((result) => {
        newStats[result.tableType as keyof typeof stats] = result.count;
      });

      setStats(newStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Erro ao buscar estatísticas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Load banners from the dedicated API
    fetchBanners();
    
    // Load stats from the user's configured API
    fetchStats();
  }, [isConfigured, config]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Dashboard</h1>
            <p className="text-muted-foreground">
              Visão geral dos dados da sua aplicação
            </p>
          </div>

          <Button 
            onClick={() => navigate('/settings')}
            variant="outline"
            className="gap-2"
          >
            <Settings size={16} />
            <span>Configurações</span>
          </Button>
        </div>

        {/* Banner Carousel */}
        {banners.length > 0 && (
          <div className="w-full overflow-hidden rounded-lg border shadow-sm">
            <BannerCarousel banners={banners} />
          </div>
        )}

        {!isConfigured ? (
          <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 animate-fade-in">
            <CardHeader>
              <CardTitle>Configuração necessária</CardTitle>
              <CardDescription>
                Configure o token da API Baserow para começar a usar o painel de administração
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate('/settings')}
                className="gap-2"
              >
                <Settings size={16} />
                <span>Ir para Configurações</span>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                  <span className="mt-2 text-sm text-muted-foreground">Carregando estatísticas...</span>
                </div>
              </div>
            )}
            <DataPanel stats={stats} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Index;
