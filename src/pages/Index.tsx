import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FieldCard from "@/components/FieldCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, Shield, Zap, Search, Star, MapPin, Clock, Tag, Users } from "lucide-react";
import heroImage from "@/assets/hero-football.jpg";
import { useState, useEffect } from "react";
import fieldOutdoor from "@/assets/field-outdoor.jpg";

const Index = () => {
  const navigate = useNavigate();
  const [searchArea, setSearchArea] = useState("");
  const [searchTime, setSearchTime] = useState("");
  const [searchType, setSearchType] = useState("");

  const handleSearch = () => {
    // Navigate to fields page with search params
    const params = new URLSearchParams();
    if (searchArea) params.append("area", searchArea);
    if (searchTime) params.append("time", searchTime);
    if (searchType) params.append("type", searchType);
    navigate(`/fields?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-[700px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="Football field" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
        </div>
        
        <div className="container mx-auto px-4 z-10 relative">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground text-center">
              Đặt sân bóng{" "}
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                nhanh chóng
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 text-center">
              Xem lịch trống theo thời gian thực - Đặt sân chỉ trong vài giây
            </p>
            
            {/* Search Form */}
            <Card className="p-6 bg-card/95 backdrop-blur-sm border-border/50 shadow-lg">
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block text-foreground">Khu vực</label>
                  <Select value={searchArea} onValueChange={setSearchArea}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn khu vực" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả khu vực</SelectItem>
                      <SelectItem value="quan1">Quận 1</SelectItem>
                      <SelectItem value="quan2">Quận 2</SelectItem>
                      <SelectItem value="quan3">Quận 3</SelectItem>
                      <SelectItem value="quan7">Quận 7</SelectItem>
                      <SelectItem value="quan10">Quận 10</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block text-foreground">Thời gian</label>
                  <Select value={searchTime} onValueChange={setSearchTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn thời gian" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Sáng (6:00 - 12:00)</SelectItem>
                      <SelectItem value="afternoon">Chiều (12:00 - 18:00)</SelectItem>
                      <SelectItem value="evening">Tối (18:00 - 22:00)</SelectItem>
                      <SelectItem value="night">Đêm (22:00 - 24:00)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block text-foreground">Loại sân</label>
                  <Select value={searchType} onValueChange={setSearchType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại sân" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="5v5">5 người</SelectItem>
                      <SelectItem value="7v7">7 người</SelectItem>
                      <SelectItem value="11v11">11 người</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleSearch} 
                    size="lg" 
                    className="w-full text-lg shadow-glow hover:shadow-glow"
                  >
                    <Search className="w-5 h-5 mr-2" />
                    Tìm sân ngay
                  </Button>
                </div>
              </div>
            </Card>

            <div className="flex gap-4 justify-center mt-6">
              <Link to="/fields">
                <Button variant="outline" size="lg" className="text-lg px-8">
                  Xem lịch trống
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-hero rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
                <Calendar className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Xem lịch trống</h3>
              <p className="text-muted-foreground">
                Kiểm tra lịch trống của sân theo thời gian thực
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-hero rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
                <Zap className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Đặt nhanh chóng</h3>
              <p className="text-muted-foreground">
                Đặt sân chỉ trong vài giây với giao diện đơn giản
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-hero rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
                <Shield className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">An toàn & tiện lợi</h3>
              <p className="text-muted-foreground">
                Thanh toán an toàn, quản lý lịch đặt dễ dàng
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Fields */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-foreground">Sân bóng nổi bật</h2>
            <p className="text-xl text-muted-foreground">Khám phá các sân bóng được đặt nhiều nhất và đánh giá cao</p>
          </div>
          <PopularFieldsGrid />
          <div className="text-center mt-12">
            <Link to="/fields">
              <Button size="lg" className="px-8">
                Xem tất cả sân
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Promotions & Events */}
      <section id="promotions" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-foreground">Khuyến mãi & Sự kiện</h2>
            <p className="text-xl text-muted-foreground">Ưu đãi hấp dẫn dành cho bạn</p>
          </div>
          <PromotionsCarousel />
        </div>
      </section>

      {/* Reviews & Testimonials */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-foreground">Đánh giá từ khách hàng</h2>
            <p className="text-xl text-muted-foreground">Những phản hồi chân thực từ người đã sử dụng dịch vụ</p>
          </div>
          <ReviewsGrid />
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;

function PopularFieldsGrid() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/pitches');
        const data = await res.json();
        if (mounted && data?.success) {
          const mapped = (data.data || []).slice(0, 6).map((p: any) => ({
            id: p.id,
            name: p.name,
            image: p.image || fieldOutdoor,
            price: p.price,
            location: p.location,
            capacity: p.type === '11v11' ? '22' : p.type === '7v7' ? '14' : '10',
            type: p.type,
          }));
          setItems(mapped);
        }
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {loading && items.length === 0 ? (
        <div className="col-span-full text-center text-muted-foreground">Đang tải...</div>
      ) : items.length === 0 ? (
        <div className="col-span-full text-center text-muted-foreground">Chưa có sân hoạt động để hiển thị</div>
      ) : (
        items.map((f) => <FieldCard key={f.id} {...f} />)
      )}
    </div>
  );
}

function PromotionsCarousel() {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/promotions?type=promotion&limit=20');
        const data = await res.json();
        if (mounted && data?.success) {
          // Filter chỉ lấy promotions có status active hoặc published
          const activePromotions = (data.data || []).filter((p: any) => 
            p.status === 'active' || p.status === 'published'
          );
          setPromotions(activePromotions);
        }
      } catch (e) {
        console.error('Error loading promotions:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const getGradientColor = (badge?: string) => {
    switch (badge?.toLowerCase()) {
      case 'hot':
        return 'bg-gradient-to-br from-orange-500 to-red-500';
      case 'combo':
        return 'bg-gradient-to-br from-green-500 to-teal-500';
      case 'đặc biệt':
      case 'special':
        return 'bg-gradient-to-br from-pink-500 to-rose-500';
      case 'mới':
      case 'new':
        return 'bg-gradient-to-br from-blue-500 to-purple-500';
      default:
        return 'bg-gradient-to-br from-blue-500 to-purple-500';
    }
  };

  if (loading && promotions.length === 0) {
    return (
      <div className="max-w-6xl mx-auto text-center text-muted-foreground py-8">
        Đang tải khuyến mãi...
      </div>
    );
  }

  if (promotions.length === 0) {
    return (
      <div className="max-w-6xl mx-auto text-center text-muted-foreground py-8">
        Chưa có khuyến mãi nào
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {promotions.map((promo) => (
            <CarouselItem key={promo.id} className="md:basis-1/2 lg:basis-1/3">
              <Card className="overflow-hidden border-border/50 hover:shadow-lg transition-all">
                {promo.image ? (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={promo.image}
                      alt={promo.title}
                      className="w-full h-full object-cover"
                    />
                    {promo.badge && (
                      <Badge className="absolute top-4 right-4 bg-white/20 text-white border-white/30 backdrop-blur-sm">
                        {promo.badge}
                      </Badge>
                    )}
                    {promo.discount && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="text-5xl font-bold text-white">{promo.discount}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`${getGradientColor(promo.badge)} p-6 text-white relative`}>
                    {promo.badge && (
                      <Badge className="absolute top-4 right-4 bg-white/20 text-white border-white/30">
                        {promo.badge}
                      </Badge>
                    )}
                    <div className="mt-8">
                      {promo.discount && (
                        <div className="text-5xl font-bold mb-2">{promo.discount}</div>
                      )}
                      <h3 className="text-xl font-semibold mb-2">{promo.title}</h3>
                      <p className="text-white/90 text-sm">{promo.description}</p>
                    </div>
                  </div>
                )}
                <CardContent className="p-6">
                  <Link to={`/promotions/${promo.id}`}>
                    <Button className="w-full" variant="outline">
                      Xem chi tiết
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}

function ReviewsGrid() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/reviews?limit=6');
        
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('text/html')) {
          console.error('Server error: Received HTML instead of JSON. Make sure the backend server is running on port 3001.');
          return;
        }
        
        if (!res.ok) {
          console.error(`HTTP error! status: ${res.status}`);
          return;
        }
        
        const data = await res.json();
        if (mounted && data?.success) {
          setReviews(data.data || []);
        }
      } catch (e) {
        console.error('Error loading reviews:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} tuần trước`;
    }
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} tháng trước`;
    }
    const years = Math.floor(diffDays / 365);
    return `${years} năm trước`;
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-12 bg-muted rounded mb-4"></div>
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Chưa có đánh giá nào
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {reviews.map((review) => (
        <Card key={review.id} className="border-border/50 hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-gradient-hero text-primary-foreground">
                  {review.avatar || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">{review.name}</h4>
                <div className="flex items-center gap-1 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < review.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <p className="text-muted-foreground mb-4">{review.comment}</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{review.field || 'N/A'}</span>
              <span className="text-muted-foreground">{formatDate(review.createdAt)}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
