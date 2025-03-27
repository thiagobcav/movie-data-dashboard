
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface DataCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  positive?: boolean;
  onClick?: () => void;
}

const DataCard: React.FC<DataCardProps> = ({
  title,
  value,
  icon,
  change,
  positive,
  onClick,
}) => {
  return (
    <Card 
      className={`
        data-card hover:shadow-md transition-all duration-300 
        ${onClick ? 'cursor-pointer transform hover:scale-[1.02]' : ''}
      `}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="p-2 bg-primary/10 rounded-full text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
      {change && (
        <CardFooter>
          <div
            className={`text-xs ${
              positive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {change}
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default DataCard;
