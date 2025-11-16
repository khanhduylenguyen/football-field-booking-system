import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Phone, Lock, Save, ArrowLeft, Eye, EyeOff, Camera, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const profileSchema = z.object({
  name: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự').max(50, 'Họ tên quá dài'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().optional().or(z.literal('')),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  confirmPassword: z.string().min(6, 'Vui lòng xác nhận mật khẩu'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

const Account = () => {
  const { user, token, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Load user data
  useEffect(() => {
    if (!user || !token) {
      navigate('/login');
      return;
    }

    const loadUserData = async () => {
      try {
        const response = await fetch(`/api/user/profile/${user.id}`);
        const data = await response.json();

        if (data.success) {
          console.log('User data loaded:', data.data);
          console.log('Avatar URL:', data.data.avatar);
          setUserData(data.data);
          profileForm.reset({
            name: data.data.name || '',
            email: data.data.email || '',
            phone: data.data.phone || '',
          });
        } else {
          toast.error('Không thể tải thông tin tài khoản');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        toast.error('Lỗi khi tải thông tin tài khoản');
      }
    };

    loadUserData();
  }, [user, token, navigate, profileForm]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'player':
        return 'Người chơi';
      case 'owner':
        return 'Chủ sân';
      case 'admin':
        return 'Quản trị viên';
      default:
        return role;
    }
  };

  const onProfileSubmit = async (values: ProfileFormValues) => {
    if (!user) return;

    setIsLoading(true);
    try {
      console.log('Submitting profile update:', values);
      const response = await fetch(`/api/user/profile/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      console.log('Response status:', response.status, 'Content-Type:', response.headers.get('content-type'));

      // Read response as text first (can only read once)
      const responseText = await response.text();
      
      // Check if response is empty
      if (!responseText) {
        console.error('Empty response from server');
        toast.error('Server không trả về dữ liệu');
        setIsLoading(false);
        return;
      }

      // Check content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Non-JSON response received:', responseText.substring(0, 200));
        toast.error(`Lỗi server: ${response.status} ${response.statusText || 'Unknown error'}`);
        setIsLoading(false);
        return;
      }

      // Parse JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        console.error('Response text:', responseText.substring(0, 500));
        toast.error('Lỗi khi xử lý phản hồi từ server. Vui lòng kiểm tra console để biết chi tiết.');
        setIsLoading(false);
        return;
      }

      console.log('Profile update response:', { status: response.status, data });

      if (!response.ok || !data.success) {
        const errorMessage = data.message || `Lỗi ${response.status}: ${response.statusText}` || 'Cập nhật thông tin thất bại';
        console.error('Profile update failed:', errorMessage);
        toast.error(errorMessage);
        setIsLoading(false);
        return;
      }

      toast.success('Cập nhật thông tin thành công');
      setUserData(data.data);
      // Update form with new data
      profileForm.reset({
        name: data.data.name || '',
        email: data.data.email || '',
        phone: data.data.phone || '',
      });
      // Update user context to reflect changes across all pages
      updateUser({
        name: data.data.name,
        email: data.data.email,
        phone: data.data.phone,
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Lỗi khi cập nhật thông tin';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordSubmit = async (values: PasswordFormValues) => {
    if (!user) return;

    setIsLoadingPassword(true);
    try {
      const response = await fetch(`/api/user/profile/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: values.password,
          currentPassword: values.currentPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Đổi mật khẩu thành công');
        passwordForm.reset();
      } else {
        toast.error(data.message || 'Đổi mật khẩu thất bại');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Lỗi khi đổi mật khẩu');
    } finally {
      setIsLoadingPassword(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước file không được vượt quá 5MB');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`/api/user/profile/${user.id}/avatar`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Cập nhật ảnh đại diện thành công');
        setUserData(data.data);
        setAvatarPreview(null);
        
        // Update user context to reflect changes across all pages
        updateUser({ avatar: data.data.avatar });
      } else {
        toast.error(data.message || 'Cập nhật ảnh đại diện thất bại');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Lỗi khi tải lên ảnh đại diện');
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleAvatarDelete = async () => {
    if (!user) return;

    setIsUploadingAvatar(true);
    try {
      const response = await fetch(`/api/user/profile/${user.id}/avatar`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Xóa ảnh đại diện thành công');
        setUserData(data.data);
        setAvatarPreview(null);
        
        // Update user context to reflect changes across all pages
        updateUser({ avatar: null });
      } else {
        toast.error(data.message || 'Xóa ảnh đại diện thất bại');
      }
    } catch (error) {
      console.error('Error deleting avatar:', error);
      toast.error('Lỗi khi xóa ảnh đại diện');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <h1 className="text-3xl font-bold">Thông tin tài khoản</h1>
          <p className="text-muted-foreground mt-2">
            Quản lý thông tin cá nhân và cài đặt tài khoản của bạn
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    {userData?.avatar && (
                      <AvatarImage src={userData.avatar} alt={user.name} />
                    )}
                    <AvatarFallback className="bg-gradient-hero text-primary-foreground text-2xl">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 flex gap-1">
                    <label htmlFor="avatar-upload" className="cursor-pointer">
                      <div className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-1.5 shadow-lg transition-colors">
                        <Camera className="w-3.5 h-3.5" />
                      </div>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleAvatarUpload}
                        disabled={isUploadingAvatar}
                        className="hidden"
                      />
                    </label>
                    {userData?.avatar && (
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="h-7 w-7 rounded-full shadow-lg"
                        onClick={handleAvatarDelete}
                        disabled={isUploadingAvatar}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <CardTitle className="text-2xl">{user.name}</CardTitle>
                  <CardDescription className="text-base mt-1">
                    {user.email}
                  </CardDescription>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Họ và tên</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                              placeholder="Nhập họ và tên"
                              className="pl-10"
                              {...field}
                              disabled={isLoading}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                              type="email"
                              placeholder="email@example.com"
                              className="pl-10"
                              {...field}
                              disabled={isLoading}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Số điện thoại</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                              type="tel"
                              placeholder="Nhập số điện thoại"
                              className="pl-10"
                              {...field}
                              disabled={isLoading}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <span className="mr-2">Đang lưu...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Lưu thay đổi
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Password Card */}
          <Card>
            <CardHeader>
              <CardTitle>Đổi mật khẩu</CardTitle>
              <CardDescription>
                Cập nhật mật khẩu để bảo mật tài khoản của bạn
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mật khẩu hiện tại</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                              type={showCurrentPassword ? 'text' : 'password'}
                              placeholder="Nhập mật khẩu hiện tại"
                              className="pl-10 pr-10"
                              {...field}
                              disabled={isLoadingPassword}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full w-10 hover:bg-transparent"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                              {showCurrentPassword ? (
                                <EyeOff className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <Eye className="w-4 h-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mật khẩu mới</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                              type={showNewPassword ? 'text' : 'password'}
                              placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                              className="pl-10 pr-10"
                              {...field}
                              disabled={isLoadingPassword}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full w-10 hover:bg-transparent"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                              {showNewPassword ? (
                                <EyeOff className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <Eye className="w-4 h-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Xác nhận mật khẩu mới</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="Nhập lại mật khẩu mới"
                              className="pl-10 pr-10"
                              {...field}
                              disabled={isLoadingPassword}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full w-10 hover:bg-transparent"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <Eye className="w-4 h-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isLoadingPassword}
                    className="w-full"
                  >
                    {isLoadingPassword ? (
                      'Đang cập nhật...'
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Đổi mật khẩu
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Account Info Card */}
          {userData && (
            <Card>
              <CardHeader>
                <CardTitle>Thông tin tài khoản</CardTitle>
                <CardDescription>
                  Thông tin chi tiết về tài khoản của bạn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Vai trò</Label>
                    <p className="font-medium">{getRoleLabel(userData.role)}</p>
                  </div>
                  {userData.createdAt && (
                    <div>
                      <Label className="text-muted-foreground">Ngày tạo</Label>
                      <p className="font-medium">
                        {new Date(userData.createdAt).toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  )}
                  {userData.updatedAt && (
                    <div>
                      <Label className="text-muted-foreground">Cập nhật lần cuối</Label>
                      <p className="font-medium">
                        {new Date(userData.updatedAt).toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  )}
                  {userData.isActive !== undefined && (
                    <div>
                      <Label className="text-muted-foreground">Trạng thái</Label>
                      <p className="font-medium">
                        {userData.isActive ? (
                          <span className="text-green-600">Đang hoạt động</span>
                        ) : (
                          <span className="text-red-600">Đã khóa</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Account;

