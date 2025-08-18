import { useState, useEffect } from "react";
import { Box, Text, Button } from "zmp-ui";
import Header from "./header";
import ChangePasswordModal from "./ChangePassword";
import { apiService, Supplier, DraftOrder } from "../services/api";

interface ProfileProps {
  onBack: () => void;
  onLogout: () => void;
  onPasswordChange: (newPassword: string) => void;
  supplierId: string;
  orders?: any[]; // Thêm prop orders để tính thống kê
  draftOrders?: DraftOrder[]; // Dùng để tính tổng đơn giống trang Đơn hàng
}

const Profile = ({ onBack, onLogout, onPasswordChange, supplierId, orders = [], draftOrders = [] }: ProfileProps) => {
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allDraftOrders, setAllDraftOrders] = useState<DraftOrder[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch supplier profile
        const supplierData = await apiService.getSupplierProfile(supplierId);
        setSupplier(supplierData);
        
        // Fetch all draft orders for statistics
        if (supplierData?.cr44a_manhacungcap) {
          const allOrders = await apiService.getAllDraftOrders(supplierData.cr44a_manhacungcap);
          setAllDraftOrders(allOrders);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (supplierId) {
      fetchData();
    }
  }, [supplierId]);

  const handleChangePassword = async (newPassword: string, confirmPassword: string) => {
    try {
      await apiService.changePassword(supplierId, newPassword);
      
      // Update local state and call parent function
      onPasswordChange(newPassword);
      setIsChangePasswordModalOpen(false);
    } catch (error) {
      alert("Có lỗi xảy ra khi đổi mật khẩu. Vui lòng thử lại!");
    }
  };

  const handleOpenChangePasswordModal = () => {
    setIsChangePasswordModalOpen(true);
  };

  // Tính toán thống kê từ allDraftOrders (bao gồm tất cả trạng thái)
  const orderStats = (() => {
    const groups: Record<string, DraftOrder[]> = {};
    allDraftOrders.forEach(item => {
      const date = new Date(item.createdon).toLocaleDateString('vi-VN');
      const key = `${item.crdfd_nhanvienmuahang} - ${date}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    
    const totalGroups = Object.keys(groups).length;
    
    // Tính số nhóm đã xác nhận (có ít nhất 1 item có crdfd_ncc_nhan_don = 191920001)
    const confirmedGroups = Object.values(groups).filter(group => 
      group.some(item => item.crdfd_ncc_nhan_don === 191920001)
    ).length;
    
    // Tính số nhóm từ chối (có ít nhất 1 item có crdfd_ncc_nhan_don = 191920002)
    const rejectedGroups = Object.values(groups).filter(group => 
      group.some(item => item.crdfd_ncc_nhan_don === 191920002)
    ).length;
    
    // Tính số nhóm chưa xác nhận (tất cả items có crdfd_ncc_nhan_don = 191920000 hoặc null/undefined)
    const pendingGroups = Object.values(groups).filter(group => 
      group.every(item => item.crdfd_ncc_nhan_don === 191920000 || item.crdfd_ncc_nhan_don === null || item.crdfd_ncc_nhan_don === undefined)
    ).length;
    
    return {
      total: totalGroups,
      confirmed: confirmedGroups,
      rejected: rejectedGroups,
      pending: pendingGroups
    };
  })();

  return (
    <Box className="bg-gray-50 min-h-screen pb-20">
      {/* Header */}
      <Header
        title="Hồ sơ"
        subtitle="Thông tin nhà cung cấp"
        showBackButton={true}
        onBack={onBack}
      />

      {/* Spacing */}
      <Box className="h-4"></Box>

      {/* Profile Info */}
      <Box className="bg-white rounded-lg p-4 mb-4 mx-4 shadow-sm">
        <Text className="text-gray-900 font-semibold mb-4" style={{ fontSize: '16px' }}>
          Thông tin công ty
        </Text>
                 <Box className="space-y-3">
           {isLoading ? (
             <Box className="text-center py-4">
               <Text className="text-gray-500">Đang tải thông tin...</Text>
             </Box>
           ) : supplier ? (
             <>
               <Box className="flex justify-between items-center">
                 <Text className="text-gray-600" style={{ fontSize: '14px' }}>Tên nhà cung cấp:</Text>
                 <Text className="text-gray-900 font-medium" style={{ fontSize: '14px' }}>
                   {supplier.crdfd_suppliername || 'Chưa có thông tin'}
                 </Text>
               </Box>
               <Box className="flex justify-between items-center">
                 <Text className="text-gray-600" style={{ fontSize: '14px' }}>Mã NCC:</Text>
                 <Text className="text-gray-900" style={{ fontSize: '14px' }}>
                   {supplier.cr44a_manhacungcap || 'Chưa có thông tin'}
                 </Text>
               </Box>
                               <Box className="flex justify-between items-center">
                  <Text className="text-gray-600" style={{ fontSize: '14px' }}>Số điện thoại:</Text>
                  <Text className="text-gray-900" style={{ fontSize: '14px' }}>
                    {supplier.crdfd_supplierphone || 'Chưa có thông tin'}
                  </Text>
                </Box>
               <Box className="flex flex-col">
                 <Text className="text-gray-600" style={{ fontSize: '14px' }}>Tên pháp lý:</Text>
                 <Text className="text-gray-900 mt-1 break-words" style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                   {supplier.crdfd_misaname || 'Chưa có thông tin'}
                 </Text>
               </Box>
                <Box className="flex flex-col">
                  <Text className="text-gray-600" style={{ fontSize: '14px' }}>Địa chỉ:</Text>
                  <Text className="text-gray-900 mt-1 break-words" style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                    {supplier.crdfd_supplier_addr || 'Chưa có thông tin'}
                  </Text>
                </Box>
             </>
           ) : (
             <Box className="text-center py-4">
               <Text className="text-red-500">Không thể tải thông tin nhà cung cấp</Text>
             </Box>
           )}
         </Box>

      </Box>

             {/* Statistics */}
       <Box className="bg-white rounded-lg p-4 mb-4 mx-4 shadow-sm">
         <Text className="text-gray-900 font-semibold mb-4" style={{ fontSize: '16px' }}>
           Thống kê đơn hàng
         </Text>
         <Box className="grid grid-cols-2 gap-4">
           <Box className="text-center p-3 bg-blue-50 rounded-lg">
             <Text className="font-bold" style={{ color: '#04A1B3', fontSize: '20px' }}>
               {orderStats.total}
             </Text>
             <Text className="text-gray-600" style={{ fontSize: '12px' }}>
               Tổng đơn hàng
             </Text>
           </Box>
           <Box className="text-center p-3 bg-green-50 rounded-lg">
             <Text className="font-bold text-green-600" style={{ fontSize: '20px' }}>
               {orderStats.confirmed}
             </Text>
             <Text className="text-gray-600" style={{ fontSize: '12px' }}>
               Đã xác nhận
             </Text>
           </Box>
           <Box className="text-center p-3 bg-yellow-50 rounded-lg">
             <Text className="font-bold text-yellow-600" style={{ fontSize: '20px' }}>
               {orderStats.pending}
             </Text>
             <Text className="text-gray-600" style={{ fontSize: '12px' }}>
               Đang chờ
             </Text>
           </Box>
           <Box className="text-center p-3 bg-red-50 rounded-lg">
             <Text className="font-bold text-red-600" style={{ fontSize: '20px' }}>
               {orderStats.rejected}
             </Text>
             <Text className="text-gray-600" style={{ fontSize: '12px' }}>
               Từ chối
             </Text>
           </Box>
         </Box>
       </Box>

      {/* Action Buttons - Đổi mật khẩu và Đăng xuất */}
      <Box className="mx-4 mb-4 space-y-3">
        <Button
          variant="secondary"
          fullWidth
          onClick={handleOpenChangePasswordModal}
          style={{
            backgroundColor: '#EBF8FF',
            borderColor: '#04A1B3',
            color: '#04A1B3',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          🔐 Đổi mật khẩu
        </Button>
        
        <Button
          variant="secondary"
          fullWidth
          onClick={onLogout}
          style={{
            backgroundColor: '#F3F4F6',
            borderColor: '#D1D5DB',
            color: '#374151',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500'
          }}
                 >
           Đăng xuất
         </Button>
       </Box>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        onSubmit={handleChangePassword}
      />
    </Box>
  );
};

export default Profile;