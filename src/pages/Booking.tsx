import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { MapPin, Users, Clock } from "lucide-react";
import { timeSlots } from "@/data/fieldsData";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import fieldOutdoor from "@/assets/field-outdoor.jpg";

const bookingSchema = z.object({
  name: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự").max(50, "Họ tên quá dài"),
  phone: z.string().regex(/^(0[3|5|7|8|9])+([0-9]{8})$/, "Số điện thoại không hợp lệ"),
  date: z.date({
    required_error: "Vui lòng chọn ngày",
  }),
  timeSlot: z.string().min(1, "Vui lòng chọn khung giờ"),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

const Booking = () => {
  const { fieldId } = useParams();
  const navigate = useNavigate();
  const [field, setField] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setNotFound(false);
        setLoadError(null);
        const safeId = encodeURIComponent(String(fieldId));
        const res = await fetch(`/api/pitches/${safeId}`);
        if (res.status === 404) {
          if (mounted) {
            setNotFound(true);
            setField(null);
          }
          return;
        }
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
          throw new Error('Server không trả JSON hợp lệ. Có thể server chưa chạy hoặc proxy lỗi.');
        }
        const data = await res.json();
        if (!res.ok || !data?.success) {
          throw new Error(data?.message || 'Không thể tải chi tiết sân');
        }
        if (mounted) setField(data.data);
      } catch (e: any) {
        if (mounted) {
          setField(null);
          setLoadError(e?.message || 'Lỗi không xác định khi tải sân');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (fieldId) load();
    return () => { mounted = false; };
  }, [fieldId]);

  // Load availability when date changes
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  useEffect(() => {
    const loadAvailability = async () => {
      if (!fieldId || !selectedDate) return;
      try {
        const y = selectedDate.getFullYear();
        const m = `${selectedDate.getMonth() + 1}`.padStart(2, '0');
        const d = `${selectedDate.getDate()}`.padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;
        const safeId = encodeURIComponent(String(fieldId));
        const res = await fetch(`/api/pitches/${safeId}/available?date=${dateStr}`);
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) throw new Error('Server không trả JSON hợp lệ');
        const data = await res.json();
        if (data?.success) {
          setBookedSlots(data.data?.bookedSlots || []);
        }
      } catch (e) {
        setBookedSlots([]);
      }
    };
    loadAvailability();
  }, [fieldId, selectedDate]);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      name: "",
      phone: "",
      date: selectedDate,
      timeSlot: "",
    },
  });

  const [selectedSlot, setSelectedSlot] = useState<string>("");

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-foreground">Đang tải sân...</h1>
        </div>
      </div>
    );
  }

  if (!loading && !field) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          {notFound ? (
            <h1 className="text-2xl font-bold text-foreground">Không tìm thấy sân</h1>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-foreground">Lỗi tải dữ liệu sân</h1>
              {loadError && (
                <p className="mt-3 text-muted-foreground">{loadError}</p>
              )}
              <div className="mt-6">
                <Button onClick={() => navigate('/fields')}>Quay lại danh sách sân</Button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  const handleBooking = async (values: BookingFormValues) => {
    if (!field) return;
    try {
      const payload = {
        fieldId: field.id,
        fieldName: field.name,
        date: format(values.date, "dd/MM/yyyy", { locale: vi }),
        dateISO: values.date.toISOString(),
        timeSlot: values.timeSlot,
        price: field.price,
        name: values.name,
        phone: values.phone,
      };
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Đặt sân thất bại');

      // Lưu tạm để trang Payment hiển thị tóm tắt
      const existing = JSON.parse(localStorage.getItem('bookings') || '[]');
      localStorage.setItem('bookings', JSON.stringify([data.data, ...existing]));

      toast.success('Đặt sân thành công! Chuyển đến thanh toán...');
      setTimeout(() => navigate(`/payment/${data.data.id}`), 800);
    } catch (e: any) {
      toast.error(e.message || 'Đặt sân thất bại');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Field Info */}
          <div>
            <Card className="overflow-hidden shadow-medium bg-gradient-card">
              <img
                src={(field?.image as string) || fieldOutdoor}
                alt={field?.name}
                className="w-full h-64 object-cover"
              />
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">{field?.name}</CardTitle>
                    <Badge className="bg-primary text-primary-foreground">{field?.type}</Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-accent">{field?.price}</div>
                    <div className="text-muted-foreground">/giờ</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">{field?.description || ''}</p>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>{field?.location}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4 text-secondary" />
                  <span>{(field?.type === '11v11' ? '22' : field?.type === '7v7' ? '14' : '10')} người</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleBooking)} className="space-y-6">
              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle>Chọn ngày</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(val) => {
                              field.onChange(val);
                              if (val) setSelectedDate(val);
                            }}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            className="rounded-md border border-border"
                            locale={vi}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle>Chọn khung giờ</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="timeSlot"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="grid grid-cols-2 gap-3">
                            {timeSlots.map((slot) => (
                              <Button
                                key={slot}
                                type="button"
                                variant={field.value === slot ? "default" : "outline"}
                                className="justify-start"
                                onClick={() => {
                                  field.onChange(slot);
                                  setSelectedSlot(slot);
                                }}
                                disabled={bookedSlots.includes(slot)}
                              >
                                <Clock className="w-4 h-4 mr-2" />
                                {slot}
                                {bookedSlots.includes(slot) && (
                                  <span className="ml-2 text-xs text-muted-foreground">(đã đặt)</span>
                                )}
                              </Button>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle>Thông tin liên hệ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Họ và tên</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nhập họ tên"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Số điện thoại</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="Nhập số điện thoại (VD: 0912345678)"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full mt-4 shadow-glow hover:shadow-glow"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? "Đang xử lý..." : "Tiếp tục thanh toán"}
                  </Button>
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Booking;
