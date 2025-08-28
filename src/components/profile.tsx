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
  orders?: any[];
  draftOrders?: DraftOrder[];
  allDraftOrders?: DraftOrder[];
}

const Profile = ({ onBack, onLogout, onPasswordChange, supplierId, orders = [], draftOrders = [], allDraftOrders = [] }: ProfileProps) => {
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supplierData = await apiService.getSupplierProfile(supplierId);
        setSupplier(supplierData);
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
      onPasswordChange(newPassword);
      setIsChangePasswordModalOpen(false);
    } catch (error) {
      alert("Có lỗi xảy ra khi đổi mật khẩu. Vui lòng thử lại!");
    }
  };

  const handleOpenChangePasswordModal = () => {
    setIsChangePasswordModalOpen(true);
  };

  // Tính toán thống kê - đếm số đơn hàng chi tiết
  const orderStats = (() => {
    const total = allDraftOrders.length;
    
    const confirmed = allDraftOrders.filter(order => 
      order.crdfd_ncc_nhan_don === 191920001
    ).length;
    
    const rejected = allDraftOrders.filter(order => 
      order.crdfd_ncc_nhan_don === 191920002
    ).length;
    
    const pending = allDraftOrders.filter(order => 
      order.crdfd_ncc_nhan_don === 191920000 || 
      order.crdfd_ncc_nhan_don === null || 
      order.crdfd_ncc_nhan_don === undefined
    ).length;
    
    return {
      total,
      confirmed,
      rejected,
      pending
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

      {/* Profile Info */}
      <Box className="bg-white rounded-xl p-4 mb-4 mx-4 shadow-sm border border-gray-100">
        <Text className="text-gray-900 font-medium mb-4 text-base">
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
                <Text className="text-gray-600 text-sm">Tên nhà cung cấp:</Text>
                <Text className="text-gray-900 font-medium text-sm">
                  {supplier.crdfd_suppliername || 'Chưa có thông tin'}
                </Text>
              </Box>
              <Box className="flex justify-between items-center">
                <Text className="text-gray-600 text-sm">Mã NCC:</Text>
                <Text className="text-gray-900 text-sm">
                  {supplier.cr44a_manhacungcap || 'Chưa có thông tin'}
                </Text>
              </Box>
              <Box className="flex justify-between items-center">
                <Text className="text-gray-600 text-sm">Số điện thoại:</Text>
                <Text className="text-gray-900 text-sm">
                  {supplier.crdfd_supplierphone || 'Chưa có thông tin'}
                </Text>
              </Box>
              <Box className="flex flex-col">
                <Text className="text-gray-600 text-sm">Tên pháp lý:</Text>
                <Text className="text-gray-900 mt-1 break-words text-sm">
                  {supplier.crdfd_misaname || 'Chưa có thông tin'}
                </Text>
              </Box>
              <Box className="flex flex-col">
                <Text className="text-gray-600 text-sm">Địa chỉ:</Text>
                <Text className="text-gray-900 mt-1 break-words text-sm">
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
      <Box className="bg-white rounded-xl p-4 mb-4 mx-4 shadow-sm border border-gray-100">
        <Text className="text-gray-900 font-medium mb-4 text-base">
          Thống kê đơn hàng
        </Text>
        <Box className="grid grid-cols-2 gap-3">
          <Box className="text-center p-3 bg-blue-50 rounded-lg">
            <Text className="font-semibold text-blue-600 text-lg">
              {orderStats.total}
            </Text>
            <Text className="text-gray-500 text-xs">
              Tổng đơn hàng chi tiết
            </Text>
          </Box>
          <Box className="text-center p-3 bg-green-50 rounded-lg">
            <Text className="font-semibold text-green-600 text-lg">
              {orderStats.confirmed}
            </Text>
            <Text className="text-gray-500 text-xs">
              Đã xác nhận
            </Text>
          </Box>
          <Box className="text-center p-3 bg-yellow-50 rounded-lg">
            <Text className="font-semibold text-yellow-600 text-lg">
              {orderStats.pending}
            </Text>
            <Text className="text-gray-500 text-xs">
              Chờ xác nhận
            </Text>
          </Box>
          <Box className="text-center p-3 bg-red-50 rounded-lg">
            <Text className="font-semibold text-red-600 text-lg">
              {orderStats.rejected}
            </Text>
            <Text className="text-gray-500 text-xs">
              Từ chối
            </Text>
          </Box>
        </Box>
      </Box>

      {/* Action Buttons */}
      <Box className="mx-4 mb-4 space-y-3">
        <Button
          variant="tertiary"
          fullWidth
          onClick={handleOpenChangePasswordModal}
          className="h-12 rounded-lg text-white font-medium"
          style={{ backgroundColor: '#04A1B3', borderColor: '#04A1B3', borderWidth: 2, borderStyle: 'solid' }}
        >
          🔐 Đổi mật khẩu
        </Button>
        
        <Button
          variant="tertiary"
          fullWidth
          onClick={onLogout}
          className="h-12 rounded-lg font-medium"
          style={{ backgroundColor: '#ffffff', color: '#04A1B3', borderColor: '#04A1B3', borderWidth: 2, borderStyle: 'solid' }}
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