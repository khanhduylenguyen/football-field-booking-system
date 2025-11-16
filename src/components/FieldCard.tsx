import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users } from "lucide-react";
import { Link } from "react-router-dom";

interface FieldCardProps {
  id: string;
  name: string;
  image: string;
  price: string;
  location: string;
  capacity: string;
  type: string;
}

const FieldCard = ({ id, name, image, price, location, capacity, type }: FieldCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-medium transition-all duration-300 group bg-gradient-card border-border/50">
      <div className="relative overflow-hidden h-48">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground shadow-soft">
          {type}
        </Badge>
      </div>
      <CardContent className="p-4">
        <h3 className="text-xl font-semibold mb-2 text-foreground">{name}</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span>{location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-secondary" />
            <span>{capacity} người</span>
          </div>
        </div>
        <div className="mt-4">
          <span className="text-2xl font-bold text-accent">{price}</span>
          <span className="text-muted-foreground">/giờ</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex gap-2">
        <Link to={`/fields`} className="flex-1">
          <Button variant="outline" className="w-full">
            Xem chi tiết
          </Button>
        </Link>
        <Link to={`/booking/${id}`} className="flex-1">
          <Button className="w-full hover:shadow-glow transition-all">
            Đặt sân ngay
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default FieldCard;
