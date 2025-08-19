import { Box, Text, Button, Spinner, Input, DatePicker } from "zmp-ui";
import { useState, useEffect } from "react";
import Header from "./header";
import Toast from "./toast";
import { DraftOrder, apiService } from "../services/api";

interface OrdersPageProps {
  supplierCode: string;
  onBack: () => void;
  allDraftOrders?: DraftOrder[];
}

const OrdersPage = ({ supplierCode, onBack, allDraftOrders }: OrdersPageProps) => {
  const [orders, setOrders] = useState<DraftOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderUpdates, setOrderUpdates] = useState<{[key: string]: {quantity: number, deliveryDate: string}}>({});
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error' | 'info'; isVisible: boolean}>({
    message: '',
    type: 'info',
    isVisible: false
  });

  useEffect(() => {
    if (allDraftOrders && allDraftOrders.length > 0) {
      // Sử dụng dữ liệu đã có sẵn
      setOrders(allDraftOrders);
      setLoading(false);
    } else {
      // Load từ API nếu không có dữ liệu sẵn
      loadOrders();
    }
  }, [supplierCode, allDraftOrders]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getAllDraftOrders(supplierCode);
      setOrders(data);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const handleQuantityChange = (orderId: string, quantity: number) => {
    setOrderUpdates(prev => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        quantity: quantity
      }
    }));
  };

  const handleDeliveryDateChange = (orderId: string, deliveryDate: string) => {
    setOrderUpdates(prev => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        deliveryDate: deliveryDate
      }
    }));
  };

  const handleConfirmOrder = async (order: DraftOrder) => {
    try {
      const update = orderUpdates[order.crdfd_kehoachhangve_draftid];
      const quantity = update?.quantity || order.crdfd_soluong;
      const deliveryDate = update?.deliveryDate || order.cr1bb_ngaygiaodukien;

      await apiService.updateDraftOrderStatus(
        order.crdfd_kehoachhangve_draftid,
        191920001, // Đã xác nhận
        quantity,
        order.crdfd_soluong,
        '', // Ghi chú
        deliveryDate
      );
      
      // Cập nhật state local thay vì load lại từ API
      setOrders(prevOrders => 
        prevOrders.filter(o => o.crdfd_kehoachhangve_draftid !== order.crdfd_kehoachhangve_draftid)
      );
      
      // Xóa update data của order đã xác nhận
      setOrderUpdates(prev => {
        const newUpdates = { ...prev };
        delete newUpdates[order.crdfd_kehoachhangve_draftid];
        return newUpdates;
      });
      
      setToast({
        message: 'Đã xác nhận đơn hàng thành công!',
        type: 'success',
        isVisible: true
      });
    } catch (error) {
      console.error('Error confirming order:', error);
      setToast({
        message: 'Có lỗi xảy ra khi xác nhận đơn hàng',
        type: 'error',
        isVisible: true
      });
    }
  };

  const handleRejectOrder = async (order: DraftOrder) => {
    try {
      await apiService.updateDraftOrderStatus(
        order.crdfd_kehoachhangve_draftid,
        191920002, // Từ chối nhận đơn
        0, // Số lượng xác nhận = 0
        order.crdfd_soluong
      );
      
      // Cập nhật state local thay vì load lại từ API
      setOrders(prevOrders => 
        prevOrders.filter(o => o.crdfd_kehoachhangve_draftid !== order.crdfd_kehoachhangve_draftid)
      );
      
      // Xóa update data của order đã từ chối
      setOrderUpdates(prev => {
        const newUpdates = { ...prev };
        delete newUpdates[order.crdfd_kehoachhangve_draftid];
        return newUpdates;
      });
      
      setToast({
        message: 'Đã từ chối đơn hàng!',
        type: 'success',
        isVisible: true
      });
    } catch (error) {
      console.error('Error rejecting order:', error);
      setToast({
        message: 'Có lỗi xảy ra khi từ chối đơn hàng',
        type: 'error',
        isVisible: true
      });
    }
  };

  // Tính toán thống kê
  const totalOrders = orders.length;
  const urgentOrders = orders.filter(order => {
    const deliveryDate = new Date(order.cr1bb_ngaygiaodukien);
    const today = new Date();
    const diffDays = Math.ceil((deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  }).length;
  const newOrders = orders.filter(order => {
    const orderDate = new Date(order.createdon);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  }).length;

  if (loading) {
    return (
      <Box className="bg-gray-50 min-h-screen">
        <Header
          title="Xác nhận đơn hàng"
          subtitle="Hiển thị các đơn hàng chưa được xác nhận"
          showBackButton={true}
          onBack={onBack}
        />
        <Box className="flex items-center justify-center py-20">
          <Spinner />
          <Text className="ml-3 text-gray-600">Đang tải đơn hàng...</Text>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="bg-gray-50 min-h-screen">
        <Header
          title="Xác nhận đơn hàng"
          subtitle="Hiển thị các đơn hàng chưa được xác nhận"
          showBackButton={true}
          onBack={onBack}
        />
        <Box className="flex flex-col items-center justify-center py-20 px-4">
          <Text className="text-red-600 text-center mb-4">{error}</Text>
          <Button onClick={loadOrders} variant="primary">
            Thử lại
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="bg-gray-50 min-h-screen">
      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
      
      {/* Header */}
      <Header
        title="Xác nhận đơn hàng"
        subtitle="Các đơn hàng chưa được xác nhận"
        showBackButton={true}
        onBack={onBack}
      />

      {/* Stats Cards */}
      <Box className="px-4 mb-4">
        <Box className="grid grid-cols-3 gap-3">
          <Box className="bg-white rounded-lg p-4 shadow-sm text-center">
            <Box className="text-2xl mb-2" style={{ color: '#8B4513' }}>📦</Box>
            <Text className="text-xl font-bold" style={{ color: '#8B4513' }}>{totalOrders}</Text>
            <Text className="text-xs text-gray-600">Tổng đơn</Text>
          </Box>
          <Box className="bg-white rounded-lg p-4 shadow-sm text-center">
            <Box className="text-2xl mb-2" style={{ color: '#DC2626' }}>🚨</Box>
            <Text className="text-xl font-bold" style={{ color: '#DC2626' }}>{urgentOrders}</Text>
            <Text className="text-xs text-gray-600">Đơn gấp</Text>
          </Box>
          <Box className="bg-white rounded-lg p-4 shadow-sm text-center">
            <Box className="text-2xl mb-2" style={{ color: '#2563EB' }}>🆕</Box>
            <Text className="text-xl font-bold" style={{ color: '#2563EB' }}>{newOrders}</Text>
            <Text className="text-xs text-gray-600">Đơn mới</Text>
          </Box>
        </Box>
      </Box>

      {/* Orders List */}
      <Box className="px-4 pb-20">
        {orders.length === 0 ? (
          <Box className="bg-white rounded-lg p-8 text-center shadow-sm">
            <Text className="text-gray-500 mb-2" style={{ fontSize: '48px' }}>📦</Text>
            <Text className="text-gray-600 font-medium mb-1">
              Chưa có đơn hàng
            </Text>
            <Text className="text-gray-500 text-sm">
              Các đơn hàng sẽ xuất hiện ở đây
            </Text>
          </Box>
        ) : (
          <Box className="space-y-4">
            {orders.map((order) => {
              const update = orderUpdates[order.crdfd_kehoachhangve_draftid];
              const currentQuantity = update?.quantity || order.crdfd_soluong;
              const currentDeliveryDate = update?.deliveryDate || order.cr1bb_ngaygiaodukien;
              const totalAmount = currentQuantity * order.crdfd_gia;

              return (
                                 <Box key={order.crdfd_kehoachhangve_draftid} className="bg-white rounded-lg p-4 shadow-sm" style={{ borderLeft: '4px solid #04A1B3' }}>
                  {/* Product Name */}
                  <Text className="font-semibold text-gray-900 mb-2" style={{ fontSize: '16px' }}>
                    {order.cr1bb_tensanpham}
                  </Text>
                  
                  {/* Employee Name */}
                  <Text className="text-gray-600 mb-3">
                    👤 {order.crdfd_nhanvienmuahang}
                  </Text>

                  {/* NGÀY GỬI và ĐƠN GIÁ cùng hàng */}
                  <Box className="grid grid-cols-2 gap-4 mb-3">
                    <Box>
                      <Text className="text-gray-500 text-xs mb-1">NGÀY GỬI</Text>
                      <Text className="text-gray-900 font-medium">
                        {formatDate(order.createdon)}
                      </Text>
                    </Box>
                                                                                   <Box className="text-right">
                       <Text className="text-gray-500 text-xs mb-1">ĐƠN GIÁ</Text>
                       <Text className="text-gray-900 font-medium" style={{ color: '#15803D' }}>
                         {formatCurrency(order.crdfd_gia)}
                       </Text>
                     </Box>
                  </Box>

                  {/* SỐ LƯỢNG và NGÀY GIAO cùng hàng */}
                  <Box className="grid grid-cols-2 gap-4 mb-3">
                    <Box>
                      <Text className="text-gray-500 text-xs mb-1">SỐ LƯỢNG (CÁI)</Text>
                      <Input
                        type="number"
                        value={currentQuantity}
                        onChange={(e) => handleQuantityChange(order.crdfd_kehoachhangve_draftid, parseInt(e.target.value) || 0)}
                        className="w-full"
                      />
                    </Box>
                    <Box>
                      <Text className="text-gray-500 text-xs mb-1">NGÀY GIAO</Text>
                      <DatePicker
                        value={currentDeliveryDate ? new Date(currentDeliveryDate) : new Date()}
                        onChange={(date) => handleDeliveryDateChange(order.crdfd_kehoachhangve_draftid, date.toISOString())}
                        placeholder="Chọn ngày giao"
                      />
                    </Box>
                  </Box>

                  {/* THÀNH TIỀN */}
                  <Box className="flex justify-between items-center mb-4">
                    <Text className="text-gray-500 text-xs">THÀNH TIỀN</Text>
                    <Text className="text-base font-bold" style={{ color: '#15803D' }}>
                      {formatCurrency(totalAmount)}
                    </Text>
                  </Box>

                  {/* Action Buttons */}
                  <Box className="flex gap-3">
                    <Button 
                      variant="secondary" 
                      className="flex-1"
                      onClick={() => handleRejectOrder(order)}
                      style={{
                        backgroundColor: '#FEE2E2',
                        borderColor: '#FCA5A5',
                        color: '#DC2626'
                      }}
                    >
                      Từ chối
                    </Button>
                                           <Button 
                        variant="primary" 
                        className="flex-1"
                        onClick={() => handleConfirmOrder(order)}
                        style={{
                          backgroundColor: '#04A1B3',
                          borderColor: '#04A1B3',
                          color: 'white'
                        }}
                      >
                        Xác nhận
                      </Button>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default OrdersPage;
