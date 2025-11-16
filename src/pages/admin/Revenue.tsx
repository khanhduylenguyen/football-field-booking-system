import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Download } from 'lucide-react';

export const AdminRevenue = () => {
  const { toast } = useToast();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [pitchId, setPitchId] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pitches, setPitches] = useState<{id:string,name:string}[]>([]);
  const [summary, setSummary] = useState<{totalRevenue:number, ordersConfirmed:number, cancelRate:number, aov:number} | null>(null);
  const [byPitch, setByPitch] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);

  const exportTopCSV = () => {
    const headers = ['Sân','Đơn','Doanh thu','AOV','Tỉ lệ hủy'];
    const rows = byPitch.map(r => [r.pitchName, r.orders, r.revenue, r.aov, `${r.cancelRate}%`]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `top_pitches_${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const load = async () => {
    try {
      setLoading(true);
      // load pitches for filter (active)
      const pRes = await fetch('/api/pitches');
      const pData = await pRes.json();
      if (pData?.success) setPitches(pData.data.map((p:any) => ({ id: p.id, name: p.name })));

      const q = new URLSearchParams();
      if (dateFrom) q.set('dateFrom', dateFrom);
      if (dateTo) q.set('dateTo', dateTo);
      if (pitchId && pitchId !== 'all') q.set('pitchId', pitchId);

      const [sRes, tRes, bRes, rRes] = await Promise.all([
        fetch(`/api/admin/revenue/summary?${q.toString()}`),
        fetch(`/api/admin/revenue/timeseries?${q.toString()}`),
        fetch(`/api/admin/revenue/by-pitch?${q.toString()}`),
        fetch(`/api/admin/bookings?status=confirmed&page=1&limit=10&${q.toString()}`)
      ]);
      const sData = await sRes.json();
      const bData = await bRes.json();
      const rData = await rRes.json();
      if (sData?.success) setSummary(sData.data);
      if (bData?.success) setByPitch(bData.data);
      if (rData?.success) setRecent(rData.data);
    } catch (e:any) {
      toast({ title: 'Lỗi', description: e?.message || 'Không thể tải dữ liệu doanh thu', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [dateFrom, dateTo, pitchId]);
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => load(), 15000);
    return () => clearInterval(id);
  }, [autoRefresh, dateFrom, dateTo, pitchId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Thống kê doanh thu</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Phân tích doanh thu toàn hệ thống</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
          <CardDescription>Lọc theo khoảng ngày và sân</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            <Select value={pitchId} onValueChange={setPitchId}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn sân" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả sân</SelectItem>
                {pitches.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2 items-center">
              <Button variant={autoRefresh ? 'default' : 'outline'} onClick={() => setAutoRefresh(v => !v)}>
                <RefreshCw className="w-4 h-4 mr-2" />{autoRefresh ? 'Tự làm mới: Bật' : 'Tự làm mới'}
              </Button>
              <Button variant="outline" onClick={() => { setDateFrom(''); setDateTo(''); setPitchId('all'); }}>Reset</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {loading ? (
          [...Array(4)].map((_,i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <Card><CardHeader><CardTitle>Tổng doanh thu</CardTitle><CardDescription>VND</CardDescription></CardHeader><CardContent><div className="text-2xl font-bold">{Intl.NumberFormat('vi-VN').format(summary?.totalRevenue || 0)}đ</div></CardContent></Card>
            <Card><CardHeader><CardTitle>Đơn thành công</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{summary?.ordersConfirmed || 0}</div></CardContent></Card>
            <Card><CardHeader><CardTitle>Tỉ lệ hủy</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{summary?.cancelRate ?? 0}%</div></CardContent></Card>
            <Card><CardHeader><CardTitle>Giá trị đơn TB</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{Intl.NumberFormat('vi-VN').format(summary?.aov || 0)}đ</div></CardContent></Card>
          </>
        )}
      </div>

      {/* Charts placeholder (can plug in recharts later) */}
      <Card>
        <CardHeader>
          <CardTitle>Biểu đồ doanh thu theo thời gian</CardTitle>
          <CardDescription>Hiển thị doanh thu theo ngày/tuần/tháng</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-40 flex items-center justify-center text-muted-foreground border rounded">Biểu đồ sẽ được thêm sau (recharts)</div>
        </CardContent>
      </Card>

      {/* Top pitches */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Top sân theo doanh thu</CardTitle>
              <CardDescription>Trong khoảng lọc</CardDescription>
            </div>
            <Button variant="outline" onClick={exportTopCSV}><Download className="w-4 h-4 mr-2"/>Xuất CSV</Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[...Array(5)].map((_,i)=>(<Skeleton key={i} className="h-10 w-full"/>))}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sân</TableHead>
                  <TableHead>Đơn</TableHead>
                  <TableHead>Doanh thu</TableHead>
                  <TableHead>AOV</TableHead>
                  <TableHead>Tỉ lệ hủy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byPitch.length > 0 ? byPitch.map((r:any) => (
                  <TableRow key={r.pitchId}>
                    <TableCell className="font-medium">{r.pitchName}</TableCell>
                    <TableCell>{r.orders}</TableCell>
                    <TableCell>{Intl.NumberFormat('vi-VN').format(r.revenue)}đ</TableCell>
                    <TableCell>{Intl.NumberFormat('vi-VN').format(r.aov)}đ</TableCell>
                    <TableCell>{r.cancelRate}%</TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Không có dữ liệu</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent confirmed bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Đơn xác nhận gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[...Array(5)].map((_,i)=>(<Skeleton key={i} className="h-10 w-full"/>))}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Sân</TableHead>
                  <TableHead>Người đặt</TableHead>
                  <TableHead>SĐT</TableHead>
                  <TableHead>Khung giờ</TableHead>
                  <TableHead>Giá</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.length > 0 ? recent.map((b:any) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.date}</TableCell>
                    <TableCell>{b.fieldName}</TableCell>
                    <TableCell>{b.name}</TableCell>
                    <TableCell>{b.phone}</TableCell>
                    <TableCell>{b.timeSlot}</TableCell>
                    <TableCell>{b.price}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Không có dữ liệu</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

