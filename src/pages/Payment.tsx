import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CreditCard, Wallet, Building2 } from "lucide-react";

const Payment = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    const bookings = JSON.parse(localStorage.getItem("bookings") || "[]");
    const currentBooking = bookings.find((b: any) => b.id === bookingId);
    if (currentBooking) {
      setBooking(currentBooking);
    }
  }, [bookingId]);

  const handlePayment = async () => {
    if (!booking || !bookingId) return;

    try {
      toast.loading("Đang xử lý thanh toán...");
      
      // Gọi API để xác nhận thanh toán và cập nhật booking trên server
      const response = await fetch('/api/payments/mock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          paymentMethod
        }),
      });

      const responseText = await response.text();
      
      if (!responseText) {
        throw new Error('Server không trả về dữ liệu');
      }

      const data = JSON.parse(responseText);

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Thanh toán thất bại');
      }

      // Cập nhật localStorage để đồng bộ với server
      const bookings = JSON.parse(localStorage.getItem("bookings") || "[]");
      const updatedBookings = bookings.map((b: any) =>
        b.id === bookingId ? { ...b, status: "confirmed", paymentMethod, ...data.data.booking } : b
      );
      localStorage.setItem("bookings", JSON.stringify(updatedBookings));

      toast.success("Thanh toán thành công!");
      setTimeout(() => {
        navigate("/my-bookings");
      }, 1000);
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Thanh toán thất bại. Vui lòng thử lại.');
    }
  };

  if (!booking) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-foreground">Không tìm thấy đơn đặt sân</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-center text-foreground">
          Thanh toán <span className="bg-gradient-hero bg-clip-text text-transparent">giả lập</span>
        </h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Booking Summary */}
          <Card className="shadow-medium bg-gradient-card">
            <CardHeader>
              <CardTitle>Chi tiết đặt sân</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sân:</span>
                <span className="font-semibold text-foreground">{booking.fieldName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ngày:</span>
                <span className="font-semibold text-foreground">{booking.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Giờ:</span>
                <span className="font-semibold text-foreground">{booking.timeSlot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Người đặt:</span>
                <span className="font-semibold text-foreground">{booking.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SĐT:</span>
                <span className="font-semibold text-foreground">{booking.phone}</span>
              </div>
              <div className="border-t border-border pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-foreground">Tổng tiền:</span>
                  <span className="text-2xl font-bold text-accent">{booking.price}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Phương thức thanh toán</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 border border-border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex items-center gap-3 cursor-pointer flex-1">
                      <CreditCard className="w-5 h-5 text-primary" />
                      <div>
                        <div className="font-medium text-foreground">Thẻ tín dụng/ghi nợ</div>
                        <div className="text-sm text-muted-foreground">Visa, Mastercard</div>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 border border-border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="ewallet" id="ewallet" />
                    <Label htmlFor="ewallet" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Wallet className="w-5 h-5 text-secondary" />
                      <div>
                        <div className="font-medium text-foreground">Ví điện tử</div>
                        <div className="text-sm text-muted-foreground">Momo, ZaloPay, VNPay</div>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 border border-border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="bank" id="bank" />
                    <Label htmlFor="bank" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Building2 className="w-5 h-5 text-accent" />
                      <div>
                        <div className="font-medium text-foreground">Chuyển khoản</div>
                        <div className="text-sm text-muted-foreground">Chuyển khoản ngân hàng</div>
                      </div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>

              <Button
                className="w-full mt-6 shadow-glow hover:shadow-glow"
                onClick={handlePayment}
              >
                Xác nhận thanh toán {booking.price}
              </Button>

              <p className="text-sm text-muted-foreground text-center mt-4">
                Đây là thanh toán giả lập. Không có giao dịch thực sự.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Payment;
