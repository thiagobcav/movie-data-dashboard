
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { toast } from 'sonner';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Skeleton } from '@/components/ui/skeleton';

const BANNERS_API_URL = "https://api.baserow.io/api/database/rows/table/491626/?user_field_names=true";
const BANNERS_API_TOKEN = "9HJjNCWkRnJDxwYZHLYG9sHgLEu2Pbar";

interface Banner {
  id: number;
  Nome: string;
  Imagem: string;
  Link: string;
  Descrição?: string;
  Usuário?: string;
}

const Promotionals = () => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanners();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Conteúdo Promocional</h1>
            <p className="text-muted-foreground">
              Visualize os banners promocionais disponíveis
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="mt-4 sm:mt-0 gap-2"
          >
            <ArrowLeft size={16} />
            <span>Voltar</span>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <div className="p-4">
                  <AspectRatio ratio={16/8}>
                    <Skeleton className="h-full w-full" />
                  </AspectRatio>
                </div>
                <CardContent className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-9 w-24" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : banners.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Nenhum banner promocional encontrado</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map((banner) => (
              <Card key={banner.id} className="overflow-hidden">
                <div className="p-4">
                  <AspectRatio ratio={16/8}>
                    <img
                      src={banner.Imagem}
                      alt={banner.Nome}
                      className="object-cover w-full h-full rounded-md"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/600x300/gray/white?text=Imagem+não+disponível';
                      }}
                    />
                  </AspectRatio>
                </div>
                <CardContent className="space-y-2">
                  <h3 className="font-medium">{banner.Nome}</h3>
                  {banner.Descrição && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {banner.Descrição}
                    </p>
                  )}
                  {banner.Usuário && (
                    <p className="text-xs text-muted-foreground">
                      Por: {banner.Usuário}
                    </p>
                  )}
                </CardContent>
                {banner.Link && (
                  <CardFooter>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => window.open(banner.Link, '_blank')}
                    >
                      <ExternalLink size={14} />
                      <span>Visitar</span>
                    </Button>
                  </CardFooter>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Promotionals;
