import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowLeft, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";

interface Promotion {
  id: string;
  title: string;
  description: string;
  content?: string;
  type: 'promotion' | 'news';
  image?: string;
  discount?: string;
  badge?: string;
  startDate?: string;
  endDate?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const PromotionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/promotions/${id}`);
        const data = await res.json();
        if (mounted && data?.success) {
          setPromotion(data.data);
        } else {
          navigate('/promotions');
        }
      } catch (e) {
        console.error('Error loading promotion:', e);
        navigate('/promotions');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (id) load();
    return () => { mounted = false; };
  }, [id, navigate]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center text-muted-foreground">Đang tải...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!promotion) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Không tìm thấy tin tức/khuyến mãi</p>
            <Link to="/promotions">
              <Button>Quay lại danh sách</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Link to="/promotions">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 w-4 h-4" />
              Quay lại
            </Button>
          </Link>

          <Card className="overflow-hidden border-border/50">
            {promotion.image && (
              <div className="relative h-64 md:h-96 overflow-hidden">
                <img
                  src={promotion.image}
                  alt={promotion.title}
                  className="w-full h-full object-cover"
                />
                {promotion.badge && (
                  <Badge className="absolute top-4 right-4 bg-white/20 text-white border-white/30 backdrop-blur-sm">
                    {promotion.badge}
                  </Badge>
                )}
              </div>
            )}
            
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="outline">
                  {promotion.type === 'promotion' ? 'Khuyến mãi' : 'Tin tức'}
                </Badge>
                {promotion.startDate && promotion.endDate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {formatDate(promotion.startDate)} - {formatDate(promotion.endDate)}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    {formatDate(promotion.createdAt)}
                  </span>
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                {promotion.title}
              </h1>

              {promotion.discount && (
                <div className="mb-6">
                  <div className="text-5xl font-bold text-accent mb-2">{promotion.discount}</div>
                </div>
              )}

              {promotion.description && (
                <p className="text-lg text-muted-foreground mb-6">
                  {promotion.description}
                </p>
              )}

              {promotion.content && (
                <div className="prose prose-sm md:prose-base max-w-none">
                  <div className="whitespace-pre-wrap text-foreground">
                    {promotion.content}
                  </div>
                </div>
              )}

              {!promotion.content && promotion.description && (
                <div className="whitespace-pre-wrap text-foreground">
                  {promotion.description}
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-border">
                <Link to="/fields">
                  <Button className="w-full md:w-auto">
                    Đặt sân ngay
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PromotionDetail;

