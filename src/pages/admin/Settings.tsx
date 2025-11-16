import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const AdminSettings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Cấu hình hệ thống</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Quản lý cài đặt và cấu hình hệ thống</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cấu hình hệ thống</CardTitle>
          <CardDescription>Module này đang được phát triển</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Tính năng cấu hình hệ thống sẽ được thêm vào trong tương lai.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

