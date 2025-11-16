import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const AdminFeedback = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quản lý phản hồi & báo cáo</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Xem và xử lý phản hồi từ người dùng</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Phản hồi & Báo cáo</CardTitle>
          <CardDescription>Module này đang được phát triển</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Tính năng quản lý phản hồi và báo cáo sẽ được thêm vào trong tương lai.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

