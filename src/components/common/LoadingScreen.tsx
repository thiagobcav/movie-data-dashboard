
import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <span className="mt-4 text-sm text-muted-foreground">Carregando...</span>
      </div>
    </div>
  );
};

export default LoadingScreen;
