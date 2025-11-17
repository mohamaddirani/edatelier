import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DressCardProps {
  name: string;
  description: string;
  price_per_day: number;
  image_url: string;
  size: string;
  color: string;
  is_available: boolean;
}

export default function DressCard({ 
  name, 
  description, 
  price_per_day, 
  image_url, 
  size, 
  color,
  is_available 
}: DressCardProps) {
  return (
    <Card className="overflow-hidden group hover:shadow-elegant transition-all duration-300">
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        <img
          src={image_url}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {!is_available && (
          <Badge className="absolute top-4 right-4 bg-destructive">
            Unavailable
          </Badge>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2">{name}</h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{description}</p>
        <div className="flex gap-2 mb-2">
          <Badge variant="outline">{size}</Badge>
          <Badge variant="outline">{color}</Badge>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <p className="text-2xl font-bold text-primary">${price_per_day}<span className="text-sm text-muted-foreground">/day</span></p>
      </CardFooter>
    </Card>
  );
}
