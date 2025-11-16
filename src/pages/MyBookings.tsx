import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Calendar, Clock, MapPin, X } from "lucide-react";
import { toast } from "sonner";

const MyBookings = () => {
  const [bookings, setBookings] = useState<any[]>([]);

  const loadBookings = () => {
    const storedBookings = JSON.parse(localStorage.getItem("bookings") || "[]");
    setBookings(storedBookings.reverse());
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleCancelBooking = (bookingId: string) => {
    const storedBookings = JSON.parse(localStorage.getItem("bookings") || "[]");
    const updatedBookings = storedBookings.filter((b: any) => b.id !== bookingId);
    localStorage.setItem("bookings", JSON.stringify(updatedBookings));
    loadBookings();
    toast.success("Đã hủy đặt sân thành công");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-primary text-primary-foreground";
      case "pending":
        return "bg-accent text-accent-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Đã xác nhận";
      case "pending":
        return "Chờ thanh toán";
      case "cancelled":
        return "Đã hủy";
      default:
        return "Không xác định";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center text-foreground">
          Lịch đặt của <span className="bg-gradient-hero bg-clip-text text-transparent">tôi</span>
        </h1>

        {bookings.length === 0 ? (
          <Card className="max-w-2xl mx-auto shadow-medium">
            <CardContent className="py-12 text-center">
              <p className="text-xl text-muted-foreground">Bạn chưa có lịch đặt sân nào</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((booking) => (
              <Card key={booking.id} className="shadow-medium hover:shadow-glow transition-all bg-gradient-card flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{booking.fieldName}</CardTitle>
                    <Badge className={getStatusColor(booking.status)}>
                      {getStatusText(booking.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 flex-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>{booking.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4 text-secondary" />
                    <span>{booking.timeSlot}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 text-accent" />
                    <span>{booking.name}</span>
                  </div>
                  <div className="border-t border-border pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Tổng tiền:</span>
                      <span className="text-xl font-bold text-accent">{booking.price}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        disabled={booking.status === "cancelled"}
                      >
                        <X className="w-4 h-4 mr-2" />
                        {booking.status === "cancelled" ? "Đã hủy" : "Hủy đặt sân"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận hủy đặt sân</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bạn có chắc chắn muốn hủy đặt sân <strong>{booking.fieldName}</strong> vào ngày{" "}
                          <strong>{booking.date}</strong> lúc <strong>{booking.timeSlot}</strong> không?
                          {booking.status === "confirmed" && (
                            <span className="block mt-2 text-destructive">
                              Lưu ý: Đơn đặt đã được xác nhận, việc hủy có thể áp dụng chính sách hoàn tiền.
                            </span>
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Không</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleCancelBooking(booking.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Xác nhận hủy
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default MyBookings;
