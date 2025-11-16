import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FieldCard from "@/components/FieldCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import fieldOutdoor from "@/assets/field-outdoor.jpg";

type SortOption = "default" | "price-asc" | "price-desc" | "name-asc";

interface Pitch {
  id: string;
  name: string;
  image?: string;
  price: string;
  priceValue?: number;
  location: string;
  type: string;
}

const Fields = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/pitches`);
        const data = await res.json();
        if (mounted && data?.success) setPitches(data.data || []);
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const filteredAndSortedFields = useMemo(() => {
    const items = pitches.map(p => ({
      id: p.id,
      name: p.name,
      image: p.image || fieldOutdoor,
      price: p.price,
      location: p.location,
      capacity: p.type === '11v11' ? '22' : p.type === '7v7' ? '14' : '10',
      type: p.type,
    }));

    let filtered = items.filter(field => {
      const matchesSearch = 
        field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        field.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "all" || field.type === typeFilter;
      return matchesSearch && matchesType;
    });

    // Sort
    if (sortBy === "price-asc") {
      filtered = [...filtered].sort((a, b) => {
        const priceA = parseInt(a.price.replace(/[^\d]/g, ""));
        const priceB = parseInt(b.price.replace(/[^\d]/g, ""));
        return priceA - priceB;
      });
    } else if (sortBy === "price-desc") {
      filtered = [...filtered].sort((a, b) => {
        const priceA = parseInt(a.price.replace(/[^\d]/g, ""));
        const priceB = parseInt(b.price.replace(/[^\d]/g, ""));
        return priceB - priceA;
      });
    } else if (sortBy === "name-asc") {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }, [pitches, searchTerm, typeFilter, sortBy]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto mb-12">
          <h1 className="text-4xl font-bold mb-6 text-center text-foreground">
            Tất cả <span className="bg-gradient-hero bg-clip-text text-transparent">sân bóng</span>
          </h1>
          
          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Tìm kiếm theo tên hoặc địa điểm..."
                className="pl-10 h-12 shadow-soft"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2 flex-1">
                <Filter className="w-5 h-5 text-muted-foreground" />
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Loại sân" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả loại</SelectItem>
                    <SelectItem value="5v5">5v5</SelectItem>
                    <SelectItem value="7v7">7v7</SelectItem>
                    <SelectItem value="11v11">11v11</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Mặc định</SelectItem>
                  <SelectItem value="price-asc">Giá: Thấp → Cao</SelectItem>
                  <SelectItem value="price-desc">Giá: Cao → Thấp</SelectItem>
                  <SelectItem value="name-asc">Tên: A → Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            <div className="col-span-full text-center text-muted-foreground">Đang tải...</div>
          ) : (
            filteredAndSortedFields.map((field) => (
              <FieldCard key={field.id} {...field} />
            ))
          )}
        </div>

        {filteredAndSortedFields.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">Không tìm thấy sân bóng phù hợp</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Fields;
