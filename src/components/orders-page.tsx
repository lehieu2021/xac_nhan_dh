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
  const [activeTab, setActiveTab] = useState(0);
  const [orderUpdates, setOrderUpdates] = useState<{[key: string]: {quantity: number, deliveryDate: string}}>({});
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error' | 'info'; isVisible: boolean}>({
    message: '',
    type: 'info',
    isVisible: false
  });
  const [rejectModal, setRejectModal] = useState<{ open: boolean; order: DraftOrder | null; reason: string; submitting: boolean; error?: string }>({
    open: false,
    order: null,
    reason: '',
    submitting: false,
  });

  // Lọc đơn hàng theo loại
  const urgentOrders = orders.filter(order => order.crdfd_urgent_type === 1);
  const autoOrders = orders.filter(order => order.crdfd_urgent_type !== 1);
  const allOrders = orders; // Tất cả đơn hàng

  useEffect(() => {
    if (allDraftOrders && allDraftOrders.length > 0) {
      setOrders(allDraftOrders);
      setLoading(false);
    } else {
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
        191920001,
        quantity,
        order.crdfd_soluong,
        '',
        deliveryDate
      );
      
      setOrders(prevOrders => 
        prevOrders.filter(o => o.crdfd_kehoachhangve_draftid !== order.crdfd_kehoachhangve_draftid)
      );
      
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

  const handleRejectOrder = async (order: DraftOrder, reason: string) => {
    try {
      await apiService.updateDraftOrderStatus(
        order.crdfd_kehoachhangve_draftid,
        191920002,
        0,
        order.crdfd_soluong,
        reason
      );
      
      setOrders(prevOrders => 
        prevOrders.filter(o => o.crdfd_kehoachhangve_draftid !== order.crdfd_kehoachhangve_draftid)
      );
      
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

  const openRejectModal = (order: DraftOrder) => {
    setRejectModal({ open: true, order, reason: '', submitting: false });
  };

  const closeRejectModal = () => {
    setRejectModal(prev => ({ ...prev, open: false, order: null, reason: '', submitting: false, error: undefined }));
  };

  const submitReject = async () => {
    if (!rejectModal.order) return;
    if (!rejectModal.reason || !rejectModal.reason.trim()) {
      setRejectModal(prev => ({ ...prev, error: 'Vui lòng nhập lý do từ chối' }));
      return;
    }
    try {
      setRejectModal(prev => ({ ...prev, submitting: true, error: undefined }));
      await handleRejectOrder(rejectModal.order, rejectModal.reason.trim());
      closeRejectModal();
    } catch (e) {
      setRejectModal(prev => ({ ...prev, submitting: false, error: 'Không thể từ chối. Vui lòng thử lại.' }));
    }
  };

  // Component hiển thị danh sách đơn hàng
  const OrderList = ({ orders }: { orders: DraftOrder[] }) => {
    if (orders.length === 0) {
      return (
        <Box className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
          <Text className="text-gray-300 mb-3" style={{ fontSize: '48px' }}>📦</Text>
          <Text className="text-gray-500 font-medium mb-1 text-base">
            Chưa có đơn hàng
          </Text>
          <Text className="text-gray-400 text-sm">
            Các đơn hàng sẽ xuất hiện ở đây
          </Text>
        </Box>
      );
    }

    return (
      <Box className="space-y-6">
        {orders.map((order) => {
          const update = orderUpdates[order.crdfd_kehoachhangve_draftid];
          const currentQuantity = update?.quantity || order.crdfd_soluong;
          const currentDeliveryDate = update?.deliveryDate || order.cr1bb_ngaygiaodukien;
          const totalAmount = currentQuantity * order.crdfd_gia;

          return (
            <Box key={order.crdfd_kehoachhangve_draftid} className="bg-white rounded-2xl p-4 shadow-md border border-gray-200">
              {/* Thông tin chính - Sản phẩm */}
              <Text className="font-bold text-gray-900 mb-3 text-lg leading-tight">
                {order.cr1bb_tensanpham}
              </Text>
              
              {/* Thông tin phụ - Người gửi */}
              <Text className="text-gray-500 mb-4 text-sm">
                👤 {order.crdfd_nhanvienmuahang}
              </Text>

              {/* Thông tin chính - Tổng tiền */}
              <Box className="bg-gray-100 rounded-xl p-3 mb-4 border border-gray-200">
                <Text className="text-gray-500 text-xs font-medium mb-1">THÀNH TIỀN</Text>
                <Text className="text-lg font-semibold text-gray-700">
                  {formatCurrency(totalAmount)}
                </Text>
              </Box>

              {/* Thông tin phụ - Grid 2 cột */}
              <Box className="grid grid-cols-2 gap-3 mb-4">
                <Box>
                  <Text className="text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">NGÀY GỬI</Text>
                  <Text className="text-gray-600 text-sm">
                    {formatDate(order.createdon)}
                  </Text>
                </Box>
                <Box>
                  <Text className="text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">ĐƠN GIÁ</Text>
                  <Text className="text-gray-600 text-sm font-medium">
                    {formatCurrency(order.crdfd_gia)}
                  </Text>
                </Box>
              </Box>

              {/* Form chỉnh sửa - Số lượng và ngày giao */}
              <Box className="grid grid-cols-2 gap-3 mb-4">
                <Box>
                  <Text className="text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">
                    SỐ LƯỢNG {order.cr1bb_onvical ? `(${String(order.cr1bb_onvical).toLowerCase()})` : ''}
                  </Text>
                  <Input
                    type="number"
                    value={currentQuantity}
                    onChange={(e) => handleQuantityChange(order.crdfd_kehoachhangve_draftid, parseInt(e.target.value) || 0)}
                    className="w-full h-10 text-sm border-2 border-gray-400 rounded-lg bg-white focus:border-[#04A1B3] focus:ring-1 focus:ring-[#04A1B3]"
                  />
                </Box>
                <Box>
                  <Text className="text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">NGÀY GIAO</Text>
                  <DatePicker
                    value={currentDeliveryDate ? new Date(currentDeliveryDate) : new Date()}
                    onChange={(date) => handleDeliveryDateChange(order.crdfd_kehoachhangve_draftid, date.toISOString())}
                    placeholder="Chọn ngày giao"
                  />
                </Box>
              </Box>

              {/* Action Buttons */}
              <Box className="flex gap-3">
                <Button 
                  variant="tertiary" 
                  className="flex-1 h-10 rounded-lg border text-sm"
                  style={{ backgroundColor: '#ffffff', borderColor: '#04A1B3', color: '#F87171', borderWidth: 1, borderStyle: 'solid' }}
                  onClick={() => openRejectModal(order)}
                >
                  Từ chối
                </Button>
                <Button 
                  variant="tertiary" 
                  className="flex-1 h-10 rounded-lg text-white font-medium text-sm"
                  style={{ backgroundColor: '#04A1B3', borderColor: '#04A1B3', borderWidth: 1, borderStyle: 'solid', color: '#ffffff' }}
                  onClick={() => handleConfirmOrder(order)}
                >
                  Xác nhận
                </Button>
              </Box>
            </Box>
          );
        })}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box className="bg-gray-50 min-h-screen">
        <Header
          title="Xác nhận đơn hàng"
          subtitle="Các đơn hàng chưa được xác nhận"
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
          subtitle="Các đơn hàng chưa được xác nhận"
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
    <Box className="bg-gray-100 min-h-screen">
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

      {/* Tab Navigation */}
      <Box className="px-4 py-3 border-b border-gray-200 bg-white shadow-sm">
        <Box className="flex justify-center gap-8">
          <Box 
            className="cursor-pointer py-2 relative"
            onClick={() => setActiveTab(0)}
          >
            <Text className={`text-base font-semibold ${activeTab === 0 ? 'text-gray-900' : 'text-gray-400'}`}>
              Tất cả ({allOrders.length})
            </Text>
            {activeTab === 0 && (
              <Box className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-700 rounded-full"></Box>
            )}
          </Box>
          <Box 
            className="cursor-pointer py-2 relative"
            onClick={() => setActiveTab(1)}
          >
            <Text className={`text-base font-semibold ${activeTab === 1 ? 'text-gray-900' : 'text-gray-400'}`}>
              Đơn ưu tiên ({urgentOrders.length})
            </Text>
            {activeTab === 1 && (
              <Box className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-700 rounded-full"></Box>
            )}
          </Box>
          <Box 
            className="cursor-pointer py-2 relative"
            onClick={() => setActiveTab(2)}
          >
            <Text className={`text-base font-semibold ${activeTab === 2 ? 'text-gray-900' : 'text-gray-400'}`}>
              Đơn tự động ({autoOrders.length})
            </Text>
            {activeTab === 2 && (
              <Box className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-700 rounded-full"></Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* Orders List */}
      <Box className="px-4 py-4 pb-24">
        <OrderList orders={
          activeTab === 0 ? allOrders : 
          activeTab === 1 ? urgentOrders : 
          autoOrders
        } />
      </Box>

      {/* Reject Reason Modal */}
      {rejectModal.open && (
        <Box className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <Box className="bg-white rounded-xl p-4 mx-4 w-full max-w-sm">
            <Text className="text-gray-900 text-base font-semibold mb-3">Lý do từ chối</Text>
            <Input
              placeholder="Nhập lý do..."
              value={rejectModal.reason}
              onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
              className="w-full mb-2"
            />
            {rejectModal.error && (
              <Text className="text-red-500 text-xs mb-2">{rejectModal.error}</Text>
            )}
            <Box className="flex gap-3 pt-2">
              <Button
                variant="tertiary"
                className="flex-1 border rounded-lg text-sm"
                onClick={closeRejectModal}
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                className="flex-1 rounded-lg text-sm"
                style={{ backgroundColor: '#04A1B3', borderColor: '#04A1B3' }}
                disabled={rejectModal.submitting}
                onClick={submitReject}
              >
                {rejectModal.submitting ? 'Đang xử lý...' : 'Từ chối'}
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default OrdersPage;
