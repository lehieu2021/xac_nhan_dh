import { Box, Text, Button, Spinner, Input, DatePicker } from "zmp-ui";
import { useState, useEffect, memo } from "react";
import Header from "./header";
import Toast from "./toast";
import { DraftOrder, apiService } from "../services/api";

interface OrdersPageProps {
  supplierCode: string;
  onBack: () => void;
  allDraftOrders?: DraftOrder[];
}

// Component đếm ngược độc lập để tránh re-render cả danh sách mỗi giây
const CountdownText = memo(({ createdon, urgent }: { createdon?: string; urgent?: boolean }) => {
  const [now, setNow] = useState<number>(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!createdon) {
    return <Text className="text-sm text-gray-400">N/A</Text>;
  }

  const totalMs = urgent ? 30 * 60 * 1000 : 6 * 60 * 60 * 1000;
  const createdMs = new Date(createdon).getTime();
  const remainingMs = createdMs + totalMs - now;
  const clampRemaining = Math.max(0, remainingMs);
  const hours = Math.floor(clampRemaining / 3600000);
  const minutes = Math.floor((clampRemaining % 3600000) / 60000);
  const seconds = Math.floor((clampRemaining % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const text = remainingMs <= 0 ? 'Hết hạn' : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  let color = '#059669';
  if (remainingMs <= 0) {
    color = '#DC2626';
  } else {
    const ratio = remainingMs / totalMs;
    color = ratio <= 0.2 ? '#F59E0B' : '#059669';
  }

  return (
    <Text className="text-sm font-medium" style={{ color }}>
      {text}
    </Text>
  );
});

CountdownText.displayName = 'CountdownText';

const OrdersPage = ({ supplierCode, onBack, allDraftOrders }: OrdersPageProps) => {
  const [orders, setOrders] = useState<DraftOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error' | 'info'; isVisible: boolean}>({
    message: '',
    type: 'info',
    isVisible: false
  });
  const [deliveryDates, setDeliveryDates] = useState<{[key: string]: Date}>({});
  const [deliveryDateErrors, setDeliveryDateErrors] = useState<{[key: string]: string}>({});
  const [quantityErrors, setQuantityErrors] = useState<{[key: string]: string}>({});


  // Lọc đơn hàng theo loại - chỉ hiển thị đơn chưa xác nhận
  const pendingOrders = orders.filter(order => 
    order.crdfd_ncc_nhan_don === 191920000 || 
    order.crdfd_ncc_nhan_don === null || 
    order.crdfd_ncc_nhan_don === undefined
  );
  const urgentOrders = pendingOrders.filter(order => order.crdfd_urgent_type === 1);
  const allOrders = pendingOrders; // Chỉ đơn hàng chưa xác nhận

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

  // Hàm validation ngày giao
  const validateDeliveryDate = (date: Date, orderId: string): string | null => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const deliveryDate = new Date(date);
    deliveryDate.setHours(0, 0, 0, 0);
    
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    maxDate.setHours(0, 0, 0, 0);
    
    if (deliveryDate < today) {
      return 'Ngày giao không được nhỏ hơn ngày hiện tại';
    }
    
    if (deliveryDate > maxDate) {
      return 'Ngày giao không được quá 30 ngày trong tương lai';
    }
    
    return null;
  };

  // Hàm xử lý thay đổi ngày giao
  const handleDeliveryDateChange = (date: Date, orderId: string) => {
    setDeliveryDates(prev => ({ ...prev, [orderId]: date }));
    
    // Validate và cập nhật lỗi
    const error = validateDeliveryDate(date, orderId);
    setDeliveryDateErrors(prev => ({ ...prev, [orderId]: error || '' }));
  };

  // Hàm validation số lượng
  const validateQuantity = (quantity: number, maxQuantity: number): string | null => {
    if (quantity < 0) {
      return 'Số lượng không được âm';
    }
    
    if (quantity > maxQuantity) {
      return `Số lượng không được vượt quá ${maxQuantity}`;
    }
    
    if (!Number.isInteger(quantity)) {
      return 'Số lượng phải là số nguyên';
    }
    
    return null;
  };

  // Hàm xử lý thay đổi số lượng
  const handleQuantityChange = (quantity: number, orderId: string, maxQuantity: number) => {
    const error = validateQuantity(quantity, maxQuantity);
    setQuantityErrors(prev => ({ ...prev, [orderId]: error || '' }));
  };

  const handleConfirmOrder = async (order: DraftOrder) => {
    try {
      // Lấy giá trị từ input element
      const inputElement = document.querySelector(`input[data-order-id="${order.crdfd_kehoachhangve_draftid}"]`) as HTMLInputElement;
      const quantity = inputElement ? parseInt(inputElement.value) || order.crdfd_soluong : order.crdfd_soluong;
      
      // Kiểm tra xem có lỗi số lượng nào đang tồn tại không
      if (quantityErrors[order.crdfd_kehoachhangve_draftid]) {
        setToast({
          message: 'Vui lòng sửa lỗi số lượng trước khi xác nhận',
          type: 'error',
          isVisible: true
        });
        return;
      }
      
      const selectedDeliveryDate = deliveryDates[order.crdfd_kehoachhangve_draftid] || (order.cr1bb_ngaygiaodukien ? new Date(order.cr1bb_ngaygiaodukien) : undefined);
      
      // Validation: Kiểm tra ngày giao
      if (selectedDeliveryDate) {
        const error = validateDeliveryDate(selectedDeliveryDate, order.crdfd_kehoachhangve_draftid);
        if (error) {
          setToast({
            message: error,
            type: 'error',
            isVisible: true
          });
          return;
        }
      }
      
      // Kiểm tra xem có lỗi ngày giao hoặc số lượng nào đang tồn tại không
      if (deliveryDateErrors[order.crdfd_kehoachhangve_draftid] || quantityErrors[order.crdfd_kehoachhangve_draftid]) {
        setToast({
          message: 'Vui lòng sửa tất cả lỗi trước khi xác nhận',
          type: 'error',
          isVisible: true
        });
        return;
      }
      
      await apiService.updateDraftOrderStatus(
        order.crdfd_kehoachhangve_draftid,
        191920001,
        quantity,
        order.crdfd_soluong,
        '',
        selectedDeliveryDate ? selectedDeliveryDate.toISOString() : undefined
      );
      
      setOrders(prevOrders => 
        prevOrders.filter(o => o.crdfd_kehoachhangve_draftid !== order.crdfd_kehoachhangve_draftid)
      );
      
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
        191920002,
        0,
        order.crdfd_soluong,
        'Từ chối đơn hàng'
      );
      
      setOrders(prevOrders => 
        prevOrders.filter(o => o.crdfd_kehoachhangve_draftid !== order.crdfd_kehoachhangve_draftid)
      );
      
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

  // Component hiển thị danh sách đơn hàng
  const OrderList = memo(({ orders, handleConfirmOrder, handleRejectOrder }: { 
    orders: DraftOrder[]; 
    handleConfirmOrder: (order: DraftOrder) => void;
    handleRejectOrder: (order: DraftOrder) => void;
  }) => {
    if (orders.length === 0) {
      return (
        <Box className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
          <Text className="text-gray-300 mb-3" style={{ fontSize: '48px' }}>✅</Text>
          <Text className="text-gray-500 font-medium mb-1 text-base">
            Không có đơn hàng chờ xác nhận
          </Text>
          <Text className="text-gray-400 text-sm">
            Tất cả đơn hàng đã được xử lý
          </Text>
        </Box>
      );
    }

    return (
      <Box className="space-y-6">
        {orders.map((order) => {
          const totalAmount = order.crdfd_soluong * order.crdfd_gia;

          return (
            <Box key={order.crdfd_kehoachhangve_draftid} className="bg-white rounded-2xl p-5 shadow-md border border-gray-200">
              {/* Thông tin chính - Sản phẩm */}
              <Text className="font-bold text-gray-900 mb-3 text-[18px] leading-tight">
                {order.cr1bb_tensanpham}
              </Text>
              
              {/* Thông tin phụ - Người gửi + Đồng hồ cùng hàng */}
              <Box className="flex items-center justify-between mb-4">
                <Text className="text-gray-500 text-sm">
                  👤 {order.crdfd_nhanvienmuahang}
                </Text>
                <Box className="flex items-center gap-2">
                  {order.crdfd_urgent_type === 1 && (
                    <Text className="text-red-500 text-xs font-semibold">GẤP</Text>
                  )}
                  <CountdownText createdon={order.createdon} urgent={order.crdfd_urgent_type === 1} />
                </Box>
              </Box>

              {/* Thông tin chính - Tổng tiền */}
              <Box className="bg-gray-50 rounded-xl p-3 mb-4 border border-gray-200">
                <Text className="text-gray-500 text-xs font-medium mb-1">THÀNH TIỀN</Text>
                <Text className="text-lg font-semibold text-gray-700">
                  {formatCurrency(totalAmount)}
                </Text>
              </Box>

              {/* Thông tin phụ - 2 dòng */}
              <Box className="space-y-3 mb-4">
                <Box className="flex justify-between items-center">
                  <Text className="text-gray-400 text-xs font-medium uppercase tracking-wider">NGÀY GỬI</Text>
                  <Text className="text-gray-600 text-sm">
                    {formatDate(order.createdon)}
                  </Text>
                </Box>
                <Box className="flex justify-between items-center">
                  <Text className="text-gray-400 text-xs font-medium uppercase tracking-wider">ĐƠN GIÁ</Text>
                  <Text className="text-gray-600 text-sm font-medium">
                    {formatCurrency(order.crdfd_gia)}
                  </Text>
                </Box>
                <Box className="flex justify-between items-center">
                  <Text className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                    SỐ LƯỢNG {order.cr1bb_onvical ? `(${String(order.cr1bb_onvical).toLowerCase()})` : ''}
                  </Text>
                  <Text className="text-gray-600 text-sm font-medium">
                    {order.crdfd_soluong}
                  </Text>
                </Box>
                  <Box>
                    <input
                      type="number"
                      defaultValue={order.crdfd_soluong.toString()}
                      data-order-id={order.crdfd_kehoachhangve_draftid}
                      style={{
                        width: '100%',
                        height: '40px',
                        fontSize: '14px',
                        border: quantityErrors[order.crdfd_kehoachhangve_draftid] ? '3px solid #DC2626' : '3px solid #6B7280',
                        borderRadius: '8px',
                        backgroundColor: '#ffffff',
                        textAlign: 'right',
                        padding: '8px 12px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => {
                        e.target.style.border = '3px solid #04A1B3';
                      }}
                      onBlur={(e) => {
                        const quantity = parseInt(e.target.value) || 0;
                        handleQuantityChange(quantity, order.crdfd_kehoachhangve_draftid, order.crdfd_soluong);
                        
                        if (quantityErrors[order.crdfd_kehoachhangve_draftid]) {
                          e.target.style.border = '3px solid #DC2626';
                        } else {
                          e.target.style.border = '3px solid #6B7280';
                        }
                      }}
                    />
                    {quantityErrors[order.crdfd_kehoachhangve_draftid] && (
                      <Text className="text-red-500 text-xs mt-1">
                        {quantityErrors[order.crdfd_kehoachhangve_draftid]}
                      </Text>
                    )}
                  </Box>
                <Box className="flex justify-between items-center">
                  <Text className="text-gray-400 text-xs font-medium uppercase tracking-wider">NGÀY GIAO</Text>
                  <Box className="w-40">
                    <DatePicker
                      value={deliveryDates[order.crdfd_kehoachhangve_draftid] || (order.cr1bb_ngaygiaodukien ? new Date(order.cr1bb_ngaygiaodukien) : new Date())}
                      onChange={(date) => handleDeliveryDateChange(date, order.crdfd_kehoachhangve_draftid)}
                      placeholder="dd/MM/yyyy"
                    />
                  </Box>
                </Box>
                {deliveryDateErrors[order.crdfd_kehoachhangve_draftid] && (
                  <Box className="mt-1">
                    <Text className="text-red-500 text-xs">
                      {deliveryDateErrors[order.crdfd_kehoachhangve_draftid]}
                    </Text>
                  </Box>
                )}
              </Box>

              {/* Action Buttons */}
              <Box className="flex gap-3 pt-1">
                <Button 
                  variant="tertiary" 
                  className="flex-1 h-11 rounded-lg border text-sm"
                  style={{ backgroundColor: '#ffffff', borderColor: '#04A1B3', color: '#04A1B3', borderWidth: 1, borderStyle: 'solid' }}
                  onClick={() => handleRejectOrder(order)}
                >
                  Từ chối
                </Button>
                <Button 
                  variant="tertiary" 
                  className="flex-1 h-11 rounded-lg text-white font-medium text-sm"
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
  });

  OrderList.displayName = 'OrderList';

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
        </Box>
      </Box>

              {/* Orders List */}
        <Box className="px-4 py-4 pb-24">
          <OrderList 
            orders={activeTab === 0 ? allOrders : urgentOrders} 
            handleConfirmOrder={handleConfirmOrder} 
            handleRejectOrder={handleRejectOrder} 
          />
        </Box>
    </Box>
  );
};

export default OrdersPage;
