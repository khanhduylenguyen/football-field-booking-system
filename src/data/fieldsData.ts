import fieldIndoor from "@/assets/field-indoor.jpg";
import fieldOutdoor from "@/assets/field-outdoor.jpg";
import fieldPremium from "@/assets/field-premium.jpg";

export interface Field {
  id: string;
  name: string;
  image: string;
  price: string;
  location: string;
  capacity: string;
  type: string;
  description: string;
}

export const fields: Field[] = [
  {
    id: "1",
    name: "Sân 5 người - Trong nhà",
    image: fieldIndoor,
    price: "300.000đ",
    location: "Quận 1, TP.HCM",
    capacity: "10",
    type: "5v5",
    description: "Sân 5 người trong nhà, có mái che, điều hòa, phù hợp cho mọi thời tiết."
  },
  {
    id: "2",
    name: "Sân 7 người - Ngoài trời",
    image: fieldOutdoor,
    price: "500.000đ",
    location: "Quận 2, TP.HCM",
    capacity: "14",
    type: "7v7",
    description: "Sân cỏ tự nhiên ngoài trời, không gian thoáng đãng, view đẹp."
  },
  {
    id: "3",
    name: "Sân 11 người - Premium",
    image: fieldPremium,
    price: "1.200.000đ",
    location: "Quận 7, TP.HCM",
    capacity: "22",
    type: "11v11",
    description: "Sân cỏ tiêu chuẩn quốc tế, hệ thống chiếu sáng hiện đại, phòng thay đồ cao cấp."
  }
];

export const timeSlots = [
  "06:00 - 07:30",
  "07:30 - 09:00",
  "09:00 - 10:30",
  "10:30 - 12:00",
  "14:00 - 15:30",
  "15:30 - 17:00",
  "17:00 - 18:30",
  "18:30 - 20:00",
  "20:00 - 21:30"
];
