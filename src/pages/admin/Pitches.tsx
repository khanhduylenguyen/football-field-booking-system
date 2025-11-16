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
import { Check, X, Trash2, Plus, Edit } from 'lucide-react';
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

export const AdminPitches = () => {
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
    status: 'active' as 'active' | 'pending' | 'locked',
    image: '',
    slots: [] as string[],
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
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
  }, [statusFilter, typeFilter, searchTerm, minPrice, maxPrice, page]);

  const fetchPitches = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('status', statusFilter);
      params.set('page', String(page));
      params.set('limit', '10');
      if (searchTerm.trim()) params.set('q', searchTerm.trim());
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      const response = await fetch(`/api/admin/pitches?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setPitches(data.data);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách sân',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(pitches.map(p => p.id));
    else setSelectedIds([]);
  };

  const toggleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds(prev => (checked ? [...new Set([...prev, id])] : prev.filter(x => x !== id)));
  };

  const handleBulkStatus = async (status: 'active' | 'pending' | 'locked') => {
    if (selectedIds.length === 0) {
      toast({ title: 'Cảnh báo', description: 'Vui lòng chọn ít nhất một sân', variant: 'destructive' });
      return;
    }
    try {
      const res = await fetch('/api/admin/pitches/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pitchIds: selectedIds, status }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Không thể cập nhật trạng thái');
      toast({ title: 'Thành công', description: data.message });
      setSelectedIds([]);
      fetchPitches();
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message || 'Không thể cập nhật trạng thái', variant: 'destructive' });
    }
  };

  const formatVnd = (val: string) => {
    const num = parseInt(val.replace(/[^\d]/g, ''), 10) || 0;
    return new Intl.NumberFormat('vi-VN').format(num) + 'đ';
  };

  const resetForm = () => {
    setFormData({ name: '', location: '', price: '', type: '', status: 'active', image: '', slots: [] });
    setCurrentPitch(null);
    setPriceInput('');
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
      const res = await fetch('/api/admin/pitches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      let data: any = {};
      try {
        data = await res.json();
      } catch (jsonErr) {
        throw new Error('Server không trả JSON hợp lệ. Có thể kích thước ảnh quá lớn hoặc server chưa chạy.');
      }
      if (!res.ok || !data.success) {
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
      const res = await fetch(`/api/admin/pitches/${currentPitch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      let data: any = {};
      try {
        data = await res.json();
      } catch (jsonErr) {
        throw new Error('Server không trả JSON hợp lệ. Có thể kích thước ảnh quá lớn hoặc server chưa chạy.');
      }
      if (!res.ok || !data.success) {
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
      const response = await fetch(`/api/admin/pitches/${pitchId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
      const response = await fetch(`/api/admin/pitches/${pitchId}`, {
        method: 'DELETE',
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
        <p className="text-gray-500 dark:text-gray-400 mt-1">Duyệt, chỉnh sửa và quản lý sân bóng</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách sân bóng</CardTitle>
          <CardDescription>Quản lý tất cả sân bóng trong hệ thống</CardDescription>
          <div className="mt-4 flex justify-between items-center">
            <div />
            <Button onClick={() => { resetForm(); setCreateDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Thêm sân
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2">
              <Label>Tìm kiếm (tên/địa chỉ)</Label>
              <Input placeholder="Nhập từ khóa..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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
            <div>
              <Label>Giá tối thiểu</Label>
              <Input placeholder="vd 200000" value={minPrice} onChange={(e) => setMinPrice(e.target.value.replace(/[^\d]/g, ''))} />
            </div>
            <div>
              <Label>Giá tối đa</Label>
              <Input placeholder="vd 800000" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value.replace(/[^\d]/g, ''))} />
            </div>
          </div>

          {selectedIds.length > 0 && (
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Đã chọn {selectedIds.length} sân:</span>
              <Button size="sm" variant="outline" onClick={() => handleBulkStatus('active')}>Mở hoạt động</Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkStatus('pending')}>Chuyển chờ duyệt</Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkStatus('locked')}>Khóa</Button>
            </div>
          )}

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
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selectedIds.length > 0 && selectedIds.length === pitches.length}
                        onCheckedChange={(c) => toggleSelectAll(c === true)}
                      />
                    </TableHead>
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
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(pitch.id)}
                            onCheckedChange={(c) => toggleSelectOne(pitch.id, c === true)}
                          />
                        </TableCell>
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
                                  Duyệt
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleUpdateStatus(pitch.id, 'locked')}
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Từ chối
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
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
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

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm sân bóng</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên sân</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData(v => ({ ...v, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Địa chỉ</Label>
              <Input id="location" value={formData.location} onChange={(e) => setFormData(v => ({ ...v, location: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Loại sân</Label>
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
              <Label htmlFor="price">Giá</Label>
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
            <div className="space-y-2">
              <Label htmlFor="image">Ảnh sân (base64 hoặc chọn file)</Label>
              <Input id="image" placeholder="data:image/jpeg;base64,..." value={formData.image}
                onChange={(e) => setFormData(v => ({ ...v, image: e.target.value }))} />
              <Input type="file" accept="image/*" onChange={async (e) => {
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
              }} />
              {formData.image && (
                <img src={formData.image} alt="preview" className="w-32 h-20 object-cover rounded" />
              )}
            </div>
            <div className="space-y-2">
              <Label>Khung giờ</Label>
              <div className="grid grid-cols-2 gap-2">
                {timeSlots.map(s => (
                  <label key={s} className="flex items-center gap-2 text-sm">
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
            <Button onClick={handleCreate}>Tạo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật sân bóng</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name_e">Tên sân</Label>
              <Input id="name_e" value={formData.name} onChange={(e) => setFormData(v => ({ ...v, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location_e">Địa chỉ</Label>
              <Input id="location_e" value={formData.location} onChange={(e) => setFormData(v => ({ ...v, location: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type_e">Loại sân</Label>
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
              <Label htmlFor="price_e">Giá</Label>
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
            <div className="space-y-2">
              <Label htmlFor="image_e">Ảnh sân (base64 hoặc chọn file)</Label>
              <Input id="image_e" placeholder="data:image/jpeg;base64,..." value={formData.image}
                onChange={(e) => setFormData(v => ({ ...v, image: e.target.value }))} />
              <Input type="file" accept="image/*" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => setFormData(v => ({ ...v, image: String(reader.result) }));
                reader.readAsDataURL(file);
              }} />
              {formData.image && (
                <img src={formData.image} alt="preview" className="w-32 h-20 object-cover rounded" />
              )}
            </div>
            <div className="space-y-2">
              <Label>Khung giờ</Label>
              <div className="grid grid-cols-2 gap-2">
                {timeSlots.map(s => (
                  <label key={s} className="flex items-center gap-2 text-sm">
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
            <Button onClick={handleEdit}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

