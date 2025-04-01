
import React, { useEffect, useState } from 'react';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useCallback } from 'react';

interface BannerCarouselProps {
  banners: Array<{
    id: number;
    Nome?: string;
    Imagem: string;
    Link?: string;
  }>;
}

const BannerCarousel: React.FC<BannerCarouselProps> = ({ banners }) => {
  const [api, setApi] = useState<any>(null);
  const [current, setCurrent] = useState(0);
  
  const handleSelect = useCallback(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
  }, [api]);

  // Set up the carousel API
  useEffect(() => {
    if (!api) return;
    
    // Handle scrolling and sliding events
    api.on("select", handleSelect);
    
    // Clean up
    return () => {
      api.off("select", handleSelect);
    };
  }, [api, handleSelect]);
  
  // Auto-rotation for the carousel
  useEffect(() => {
    if (!api || banners.length <= 1) return;
    
    const interval = setInterval(() => {
      api.scrollNext();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [api, banners.length]);

  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <Carousel
      opts={{
        align: "start",
        loop: true,
      }}
      className="w-full"
      setApi={setApi}
    >
      <CarouselContent>
        {banners.map((banner, index) => (
          <CarouselItem key={banner.id || index}>
            <a 
              href={banner.Link || '#'} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full h-full overflow-hidden"
            >
              <AspectRatio ratio={2}>
                <img
                  src={banner.Imagem}
                  alt={banner.Nome || 'Banner promocional'}
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                    e.currentTarget.alt = 'Imagem não disponível';
                  }}
                />
              </AspectRatio>
            </a>
          </CarouselItem>
        ))}
      </CarouselContent>
      {banners.length > 1 && (
        <>
          <CarouselPrevious className="left-2" />
          <CarouselNext className="right-2" />
        </>
      )}
    </Carousel>
  );
};

export default BannerCarousel;
