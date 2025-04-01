
import React, { useEffect, useState } from 'react';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface BannerCarouselProps {
  banners: Array<{
    id: number;
    Nome?: string;
    Imagem: string;
    Link?: string;
  }>;
}

const BannerCarousel: React.FC<BannerCarouselProps> = ({ banners }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  // Auto-rotation for the carousel
  useEffect(() => {
    if (banners.length <= 1) return;
    
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [banners.length]);

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
      setActiveIndex={setActiveIndex}
      index={activeIndex}
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
