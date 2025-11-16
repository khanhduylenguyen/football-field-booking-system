import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, X, Trash2, Plus, Edit, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';

interface Pitch {
  id: string;
  name: string;
  location: string;
  price: string;
  type: string;
  status?: 'active' | 'pending' | 'locked';
  image?: string;
  priceValue?: number;
  slots?: string[];
}

export const OwnerPitches = () => {
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentPitch, setCurrentPitch] = useState<Pitch | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    price: '',
    type: '',
    status: 'pending' as 'active' | 'pending' | 'locked',
    image: '',
    slots: [] as string[],
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priceInput, setPriceInput] = useState('');
  const timeSlots = [
    '06:00 - 07:30',
    '07:30 - 09:00',
    '09:00 - 10:30',
    '10:30 - 12:00',
    '14:00 - 15:30',
    '15:30 - 17:00',
    '17:00 - 18:30',
    '18:30 - 20:00',
    '20:00 - 21:30',
  ];

  useEffect(() => {
    fetchPitches();
  }, [statusFilter, typeFilter, searchTerm, page]);

  const fetchPitches = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const params = new URLSearchParams();
      params.set('status', statusFilter);
      params.set('page', String(page));
      params.set('limit', '10');
      if (searchTerm.trim()) params.set('q', searchTerm.trim());
      if (typeFilter !== 'all') params.set('type', typeFilter);
      
      const response = await fetch(`/api/owner/pitches?${params.toString()}`, {
        headers: token ? {
          'Authorization': `Bearer ${token}`,
        } : {},
      });
      
      // Check if response is HTML (proxy error)
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        const text = await response.clone().text();
        if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
          toast({
            title: 'Lỗi Proxy',
            description: 'Vite dev server không thể kết nối đến backend. Vui lòng khởi động lại Vite dev server (npm run dev)',
            variant: 'destructive',
          });
          return;
        }
      }
      
      const data = await response.json();
      if (data.success) {
        setPitches(data.data);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        toast({
          title: 'Lỗi',
          description: data.message || 'Không thể tải danh sách sân',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể tải danh sách sân',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', location: '', price: '', type: '', status: 'pending', image: '', slots: [] });
    setCurrentPitch(null);
    setPriceInput('');
  };

  const compressImage = (base64: string, maxSizeKB = 500): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDimension = 800;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(base64);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        let quality = 0.8;
        let result = canvas.toDataURL('image/jpeg', quality);
        while (result.length > maxSizeKB * 1024 && quality > 0.1) {
          quality -= 0.1;
          result = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(result);
      };
      img.onerror = () => resolve(base64);
      img.src = base64;
    });
  };

  const handleCreate = async () => {
    try {
      if (!formData.name || !formData.location || !formData.price || !formData.type) {
        toast({ title: 'Lỗi', description: 'Vui lòng điền đầy đủ thông tin', variant: 'destructive' });
        return;
      }
      const priceNum = parseInt(String(formData.price).replace(/[^\d]/g, ''), 10) || 0;
      if (priceNum <= 0) {
        toast({ title: 'Lỗi', description: 'Giá phải là số lớn hơn 0', variant: 'destructive' });
        return;
      }
      
      // Compress image nếu là base64
      let finalImage = formData.image;
      if (finalImage && finalImage.startsWith('data:image')) {
        try {
          finalImage = await compressImage(finalImage, 500);
        } catch (e) {
          console.warn('Không thể compress ảnh:', e);
        }
      }
      
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const payload = { ...formData, image: finalImage };
      
      const res = await fetch('/api/owner/pitches', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload),
      });
      
      // Check if response is HTML (proxy error)
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        const text = await res.clone().text();
        if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
          throw new Error('Proxy lỗi: Vite dev server không thể kết nối đến backend. Vui lòng:\n1. Đảm bảo server đang chạy: npm run dev:server\n2. Khởi động lại Vite dev server: npm run dev\n3. Kiểm tra server tại http://localhost:3001/api/health');
        }
      }
      
      if (!res.ok) {
        if (res.status === 413) {
          throw new Error('Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn hoặc sử dụng URL ảnh.');
        }
        const text = await res.text();
        let data: any = {};
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(`Server lỗi (${res.status}): ${text.substring(0, 100)}`);
        }
        throw new Error(data.message || `Lỗi ${res.status}`);
      }
      
      let data: any = {};
      try {
        data = await res.json();
      } catch (jsonErr) {
        const text = await res.clone().text();
        throw new Error(`Server không trả JSON hợp lệ. Kiểm tra xem server có đang chạy tại http://localhost:3001 không. Response: ${text.substring(0, 200)}`);
      }
      
      if (!data.success) {
        throw new Error(data.message || 'Không thể tạo sân');
      }
      
      toast({ title: 'Thành công', description: data.message });
      setCreateDialogOpen(false);
      resetForm();
      fetchPitches();
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message || 'Không thể tạo sân', variant: 'destructive' });
    }
  };

  const handleEdit = async () => {
    if (!currentPitch) return;
    try {
      const priceNum = parseInt(String(formData.price).replace(/[^\d]/g, ''), 10) || 0;
      if (priceNum <= 0) {
        toast({ title: 'Lỗi', description: 'Giá phải là số lớn hơn 0', variant: 'destructive' });
        return;
      }
      
      // Compress image nếu là base64
      let finalImage = formData.image;
      if (finalImage && finalImage.startsWith('data:image')) {
        try {
          finalImage = await compressImage(finalImage, 500);
        } catch (e) {
          console.warn('Không thể compress ảnh:', e);
        }
      }
      
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const payload = { ...formData, image: finalImage };
      
      const res = await fetch(`/api/owner/pitches/${currentPitch.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload),
      });
      
      // Check if response is HTML (proxy error)
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        const text = await res.clone().text();
        if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
          throw new Error('Proxy lỗi: Vite dev server không thể kết nối đến backend. Vui lòng:\n1. Đảm bảo server đang chạy: npm run dev:server\n2. Khởi động lại Vite dev server: npm run dev\n3. Kiểm tra server tại http://localhost:3001/api/health');
        }
      }
      
      if (!res.ok) {
        if (res.status === 413) {
          throw new Error('Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn hoặc sử dụng URL ảnh.');
        }
        const text = await res.text();
        let data: any = {};
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(`Server lỗi (${res.status}): ${text.substring(0, 100)}`);
        }
        throw new Error(data.message || `Lỗi ${res.status}`);
      }
      
      let data: any = {};
      try {
        data = await res.json();
      } catch (jsonErr) {
        const text = await res.clone().text();
        throw new Error(`Server không trả JSON hợp lệ. Kiểm tra xem server có đang chạy tại http://localhost:3001 không. Response: ${text.substring(0, 200)}`);
      }
      
      if (!data.success) {
        throw new Error(data.message || 'Không thể cập nhật sân');
      }
      
      toast({ title: 'Thành công', description: data.message });
      setEditDialogOpen(false);
      resetForm();
      fetchPitches();
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message || 'Không thể cập nhật sân', variant: 'destructive' });
    }
  };

  const handleEditClick = (pitch: Pitch) => {
    setCurrentPitch(pitch);
    setFormData({
      name: pitch.name,
      location: pitch.location,
      price: String(pitch.priceValue || pitch.price || ''),
      type: pitch.type,
      status: (pitch.status || 'active') as 'active' | 'pending' | 'locked',
      image: pitch.image || '',
      slots: pitch.slots || [],
    });
    const digits = String(pitch.priceValue || '').replace(/[^\d]/g, '');
    setPriceInput(digits ? new Intl.NumberFormat('vi-VN').format(parseInt(digits, 10)) + 'đ' : '');
    setEditDialogOpen(true);
  };

  const handleUpdateStatus = async (pitchId: string, status: 'active' | 'pending' | 'locked') => {
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const response = await fetch(`/api/owner/pitches/${pitchId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Thành công',
          description: data.message,
        });
        fetchPitches();
      } else {
        toast({
          title: 'Lỗi',
          description: data.message || 'Không thể cập nhật trạng thái',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật trạng thái',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (pitchId: string) => {
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const response = await fetch(`/api/owner/pitches/${pitchId}`, {
        method: 'DELETE',
        headers: token ? {
          'Authorization': `Bearer ${token}`,
        } : {},
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Thành công',
          description: data.message,
        });
        fetchPitches();
      } else {
        toast({
          title: 'Lỗi',
          description: data.message || 'Không thể xóa sân',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa sân',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status?: string) => {
    const actualStatus = status || 'active';
    const badges = {
      active: <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Hoạt động</Badge>,
      pending: <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Chờ duyệt</Badge>,
      locked: <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Bị khóa</Badge>,
    };
    return badges[actualStatus as keyof typeof badges] || badges.active;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quản lý sân bóng</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Quản lý sân bóng của bạn</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách sân bóng</CardTitle>
          <CardDescription>Quản lý tất cả sân bóng của bạn</CardDescription>
          <div className="mt-4 flex justify-between items-center">
            <div />
            <Button onClick={() => { resetForm(); setCreateDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Thêm sân mới
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <Label>Tìm kiếm (tên/địa chỉ)</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Nhập từ khóa..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label>Loại sân</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Loại sân" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="5v5">5 người</SelectItem>
                  <SelectItem value="7v7">7 người</SelectItem>
                  <SelectItem value="11v11">11 người</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Trạng thái</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="pending">Chờ duyệt</SelectItem>
                  <SelectItem value="locked">Bị khóa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên sân</TableHead>
                    <TableHead>Địa chỉ</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Giá</TableHead>
                    <TableHead>Ảnh</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pitches.length > 0 ? (
                    pitches.map((pitch) => (
                      <TableRow key={pitch.id}>
                        <TableCell className="font-medium">{pitch.name}</TableCell>
                        <TableCell>{pitch.location}</TableCell>
                        <TableCell>{pitch.type}</TableCell>
                        <TableCell>{pitch.price}</TableCell>
                        <TableCell>
                          {pitch.image ? (
                            <img src={pitch.image} alt={pitch.name} className="w-12 h-8 object-cover rounded" />
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(pitch.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditClick(pitch)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Sửa
                            </Button>
                            {pitch.status === 'pending' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleUpdateStatus(pitch.id, 'active')}
                                >
                                  <Check className="w-4 h-4 mr-2" />
                                  Kích hoạt
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleUpdateStatus(pitch.id, 'locked')}
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Khóa
                                </Button>
                              </>
                            )}
                            {pitch.status === 'active' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateStatus(pitch.id, 'locked')}
                              >
                                Khóa
                              </Button>
                            )}
                            {pitch.status === 'locked' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateStatus(pitch.id, 'active')}
                              >
                                Mở khóa
                              </Button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Xác nhận xóa sân</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Bạn có chắc chắn muốn xóa sân "{pitch.name}"? Hành động này không thể hoàn tác.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(pitch.id)}>
                                    Xóa
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        Không tìm thấy sân nào
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Trang {page} / {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thêm sân bóng mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên sân <span className="text-red-500">*</span></Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={(e) => setFormData(v => ({ ...v, name: e.target.value }))} 
                placeholder="Ví dụ: Sân 5 người - Trong nhà"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Địa chỉ <span className="text-red-500">*</span></Label>
              <Input 
                id="location" 
                value={formData.location} 
                onChange={(e) => setFormData(v => ({ ...v, location: e.target.value }))} 
                placeholder="Ví dụ: Quận 1, TP.HCM"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Loại sân <span className="text-red-500">*</span></Label>
                <Select value={formData.type} onValueChange={(val) => setFormData(v => ({ ...v, type: val }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại sân" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5v5">5 người</SelectItem>
                    <SelectItem value="7v7">7 người</SelectItem>
                    <SelectItem value="11v11">11 người</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Giá (VNĐ) <span className="text-red-500">*</span></Label>
                <Input
                  id="price"
                  value={priceInput}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/[^\d]/g, '');
                    setFormData(v => ({ ...v, price: digits }));
                    setPriceInput(digits ? new Intl.NumberFormat('vi-VN').format(parseInt(digits, 10)) + 'đ' : '');
                  }}
                  placeholder="Nhập số, ví dụ 200000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Ảnh sân</Label>
              <Input 
                id="image" 
                placeholder="URL ảnh hoặc base64" 
                value={formData.image}
                onChange={(e) => setFormData(v => ({ ...v, image: e.target.value }))} 
              />
              <Input 
                type="file" 
                accept="image/*" 
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 3 * 1024 * 1024) {
                    toast({ title: 'Ảnh quá lớn', description: 'Vui lòng chọn ảnh ≤ 3MB', variant: 'destructive' });
                    e.currentTarget.value = '';
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => setFormData(v => ({ ...v, image: String(reader.result) }));
                  reader.readAsDataURL(file);
                }} 
              />
              {formData.image && (
                <img src={formData.image} alt="preview" className="w-32 h-20 object-cover rounded border" />
              )}
            </div>
            <div className="space-y-2">
              <Label>Khung giờ hoạt động</Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded p-2">
                {timeSlots.map(s => (
                  <label key={s} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted p-1 rounded">
                    <Checkbox
                      checked={formData.slots.includes(s)}
                      onCheckedChange={(c) => setFormData(v => ({
                        ...v,
                        slots: c === true ? [...new Set([...v.slots, s])] : v.slots.filter(x => x !== s)
                      }))}
                    />
                    <span>{s}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select value={formData.status} onValueChange={(val) => setFormData(v => ({ ...v, status: val as any }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Chờ duyệt</SelectItem>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="locked">Bị khóa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleCreate}>Tạo sân</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cập nhật sân bóng</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name_e">Tên sân <span className="text-red-500">*</span></Label>
              <Input 
                id="name_e" 
                value={formData.name} 
                onChange={(e) => setFormData(v => ({ ...v, name: e.target.value }))} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location_e">Địa chỉ <span className="text-red-500">*</span></Label>
              <Input 
                id="location_e" 
                value={formData.location} 
                onChange={(e) => setFormData(v => ({ ...v, location: e.target.value }))} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type_e">Loại sân <span className="text-red-500">*</span></Label>
                <Select value={formData.type} onValueChange={(val) => setFormData(v => ({ ...v, type: val }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại sân" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5v5">5 người</SelectItem>
                    <SelectItem value="7v7">7 người</SelectItem>
                    <SelectItem value="11v11">11 người</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price_e">Giá (VNĐ) <span className="text-red-500">*</span></Label>
                <Input
                  id="price_e"
                  value={priceInput}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/[^\d]/g, '');
                    setFormData(v => ({ ...v, price: digits }));
                    setPriceInput(digits ? new Intl.NumberFormat('vi-VN').format(parseInt(digits, 10)) + 'đ' : '');
                  }}
                  placeholder="Nhập số, ví dụ 200000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="image_e">Ảnh sân</Label>
              <Input 
                id="image_e" 
                placeholder="URL ảnh hoặc base64" 
                value={formData.image}
                onChange={(e) => setFormData(v => ({ ...v, image: e.target.value }))} 
              />
              <Input 
                type="file" 
                accept="image/*" 
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 3 * 1024 * 1024) {
                    toast({ title: 'Ảnh quá lớn', description: 'Vui lòng chọn ảnh ≤ 3MB', variant: 'destructive' });
                    e.currentTarget.value = '';
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => setFormData(v => ({ ...v, image: String(reader.result) }));
                  reader.readAsDataURL(file);
                }} 
              />
              {formData.image && (
                <img src={formData.image} alt="preview" className="w-32 h-20 object-cover rounded border" />
              )}
            </div>
            <div className="space-y-2">
              <Label>Khung giờ hoạt động</Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded p-2">
                {timeSlots.map(s => (
                  <label key={s} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted p-1 rounded">
                    <Checkbox
                      checked={formData.slots.includes(s)}
                      onCheckedChange={(c) => setFormData(v => ({
                        ...v,
                        slots: c === true ? [...new Set([...v.slots, s])] : v.slots.filter(x => x !== s)
                      }))}
                    />
                    <span>{s}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select value={formData.status} onValueChange={(val) => setFormData(v => ({ ...v, status: val as any }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Chờ duyệt</SelectItem>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="locked">Bị khóa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleEdit}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
