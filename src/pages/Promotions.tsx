import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Calendar, Tag, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

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

const Promotions = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<'all' | 'promotion' | 'news'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 12;

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (typeFilter !== 'all') params.set('type', typeFilter);
        if (searchTerm.trim()) params.set('q', searchTerm.trim());
        params.set('page', String(page));
        params.set('limit', String(limit));

        const res = await fetch(`/api/promotions?${params.toString()}`);
        const data = await res.json();
        if (mounted && data?.success) {
          setPromotions(data.data || []);
          setTotalPages(data.pagination?.totalPages || 1);
        }
      } catch (e) {
        console.error('Error loading promotions:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [typeFilter, searchTerm, page]);

  const getGradientColor = (badge?: string) => {
    switch (badge?.toLowerCase()) {
      case 'hot':
      case 'mới':
        return 'bg-gradient-to-br from-orange-500 to-red-500';
      case 'combo':
        return 'bg-gradient-to-br from-green-500 to-teal-500';
      case 'đặc biệt':
      case 'special':
        return 'bg-gradient-to-br from-pink-500 to-rose-500';
      default:
        return 'bg-gradient-to-br from-blue-500 to-purple-500';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Tin tức & <span className="bg-gradient-hero bg-clip-text text-transparent">Khuyến mãi</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Ưu đãi hấp dẫn và tin tức mới nhất dành cho bạn
            </p>
          </div>

          {/* Filters */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Tìm kiếm tin tức, khuyến mãi..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              <Select
                value={typeFilter}
                onValueChange={(value: 'all' | 'promotion' | 'news') => {
                  setTypeFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="promotion">Khuyến mãi</SelectItem>
                  <SelectItem value="news">Tin tức</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tabs for quick filter */}
            <Tabs value={typeFilter} onValueChange={(value) => {
              setTypeFilter(value as 'all' | 'promotion' | 'news');
              setPage(1);
            }}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">Tất cả</TabsTrigger>
                <TabsTrigger value="promotion">Khuyến mãi</TabsTrigger>
                <TabsTrigger value="news">Tin tức</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Đang tải...
            </div>
          ) : promotions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg mb-4">
                Chưa có tin tức hoặc khuyến mãi nào
              </p>
              <p className="text-sm text-muted-foreground">
                Vui lòng quay lại sau
              </p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {promotions.map((promo) => (
                  <Card
                    key={promo.id}
                    className="overflow-hidden hover:shadow-lg transition-all duration-300 group border-border/50"
                  >
                    {promo.image ? (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={promo.image}
                          alt={promo.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        {promo.badge && (
                          <Badge className="absolute top-3 right-3 bg-white/20 text-white border-white/30 backdrop-blur-sm">
                            {promo.badge}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div className={`relative h-48 ${getGradientColor(promo.badge)}`}>
                        {promo.badge && (
                          <Badge className="absolute top-4 right-4 bg-white/20 text-white border-white/30">
                            {promo.badge}
                          </Badge>
                        )}
                        {promo.discount && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-5xl font-bold text-white">{promo.discount}</div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {promo.type === 'promotion' ? 'Khuyến mãi' : 'Tin tức'}
                        </Badge>
                        {promo.startDate && promo.endDate && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {formatDate(promo.startDate)} - {formatDate(promo.endDate)}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <h3 className="text-xl font-semibold mb-2 text-foreground line-clamp-2">
                        {promo.title}
                      </h3>
                      
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                        {promo.description || promo.content}
                      </p>
                      
                      {promo.discount && !promo.image && (
                        <div className="mb-4">
                          <div className="text-3xl font-bold text-accent">{promo.discount}</div>
                        </div>
                      )}
                    </CardContent>
                    
                    <CardFooter className="p-6 pt-0">
                      <Link to={`/promotions/${promo.id}`} className="w-full">
                        <Button className="w-full" variant="outline">
                          Xem chi tiết
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Trước
                  </Button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? "default" : "outline"}
                          onClick={() => setPage(pageNum)}
                          className="w-10"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Sau
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Promotions;

