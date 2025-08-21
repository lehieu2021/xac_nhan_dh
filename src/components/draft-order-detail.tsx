import { Box, Text, Button, Input, Spinner, DatePicker } from "zmp-ui";
import { useState, useEffect } from "react";
import Header from "./header";
import { DraftOrder } from "../services/api";
import { apiService } from "../services/api";

interface DraftOrderDetailProps {
  orders: DraftOrder[];
  onBack: () => void;
  onConfirm: (orderIds: string[], updatedItems: { id: string; quantity: number; deliveryDate: string }[], notes: string) => void;
  onReject: (orderIds: string[]) => void;
}

const DraftOrderDetail = ({ orders, onBack, onConfirm, onReject }: DraftOrderDetailProps) => {
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [deliveryDates, setDeliveryDates] = useState<{[key: string]: Date}>({});
  const [quantities, setQuantities] = useState<{[key: string]: number}>({});
  const [quantityErrors, setQuantityErrors] = useState<{[key: string]: string}>({});
  const [inputValues, setInputValues] = useState<{[key: string]: string}>({});

  // Khởi tạo giá trị ban đầu cho input
  useEffect(() => {
    const initialValues: {[key: string]: string} = {};
    orders.forEach(order => {
      initialValues[order.crdfd_kehoachhangve_draftid] = order.crdfd_soluong.toString();
    });
    setInputValues(initialValues);
  }, [orders]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const day = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      return `${day} ${time}`;
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

  const formatDateVN = (date?: Date) => {
    try {
      if (!date) return '';
      return date.toLocaleDateString('vi-VN');
    } catch {
      return '';
    }
  };

  // Helper function để hiển thị trạng thái NCC nhận đơn
  const getOrderStatusDisplay = (status?: number) => {
    switch (status) {
      case 191920000:
        return { text: 'Chưa xác nhận', color: '#6B7280', bgColor: '#F3F4F6' };
      case 191920001:
        return { text: 'Đã xác nhận', color: '#059669', bgColor: '#D1FAE5' };
      case 191920002:
        return { text: 'Từ chối nhận đơn', color: '#DC2626', bgColor: '#FEE2E2' };
      default:
        return { text: 'Chưa xác nhận', color: '#6B7280', bgColor: '#F3F4F6' };
    }
  };

  const handleDateChange = (orderId: string, date: Date) => {
    setDeliveryDates(prev => ({
      ...prev,
      [orderId]: date
    }));
  };

  const handleQuantityChange = (orderId: string, value: string) => {
    // Luôn cập nhật input value để hiển thị
    setInputValues(prev => ({
      ...prev,
      [orderId]: value
    }));

    const numValue = parseInt(value) || 0;
    const originalQuantity = orders.find(order => order.crdfd_kehoachhangve_draftid === orderId)?.crdfd_soluong || 0;
    
    // Validation: Không cho phép nhập vượt quá số lượng ban đầu
    if (numValue > originalQuantity) {
      setQuantityErrors(prev => ({
        ...prev,
        [orderId]: `Số lượng không được vượt quá ${originalQuantity}`
      }));
      // Reset input value về số lượng ban đầu
      setInputValues(prev => ({
        ...prev,
        [orderId]: originalQuantity.toString()
      }));
      // Không cập nhật quantities nếu vượt quá
      return;
    }
    
    // Clear error if validation passes
    setQuantityErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[orderId];
      return newErrors;
    });
    
    // Chỉ cập nhật quantities khi validation pass
    setQuantities(prev => ({
      ...prev,
      [orderId]: numValue
    }));
  };

  const handleOutOfStock = (orderId: string) => {
    setQuantities(prev => ({
      ...prev,
      [orderId]: 0
    }));
    
    // Cập nhật input value về 0
    setInputValues(prev => ({
      ...prev,
      [orderId]: "0"
    }));
    
    // Clear error when setting to 0
    setQuantityErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[orderId];
      return newErrors;
    });
  };

  // Helper function để lấy giá trị hiển thị cho input
  const getDisplayValue = (orderId: string, originalQuantity: number) => {
    const inputValue = inputValues[orderId];
    if (inputValue !== undefined) {
      return inputValue; // Hiển thị giá trị đang nhập
    }
    return originalQuantity.toString(); // Hiển thị số lượng ban đầu nếu chưa có input
  };





  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      
      // Kiểm tra xem có lỗi validation nào không
      if (Object.keys(quantityErrors).length > 0) {
        alert('Vui lòng kiểm tra lại số lượng nhập vào');
        return;
      }

      // Kiểm tra lại tất cả số lượng để đảm bảo không có giá trị vượt quá
      for (const order of orders) {
        const inputQuantity = quantities[order.crdfd_kehoachhangve_draftid];
        const inputValue = inputValues[order.crdfd_kehoachhangve_draftid];
        
        // Kiểm tra giá trị đã được validate
        if (inputQuantity !== undefined && inputQuantity > order.crdfd_soluong) {
          alert(`Số lượng của sản phẩm "${order.cr1bb_tensanpham}" không được vượt quá ${order.crdfd_soluong}`);
          return;
        }
        
        // Kiểm tra giá trị input hiện tại
        if (inputValue !== undefined) {
          const currentValue = parseInt(inputValue) || 0;
          if (currentValue > order.crdfd_soluong) {
            alert(`Số lượng của sản phẩm "${order.cr1bb_tensanpham}" không được vượt quá ${order.crdfd_soluong}`);
            return;
          }
        }
      }

      // Cập nhật trạng thái crdfd_ncc_nhan_don cho tất cả đơn hàng trong nhóm
      for (const order of orders) {
        const deliveryDate = deliveryDates[order.crdfd_kehoachhangve_draftid];
        const confirmedQuantity = quantities[order.crdfd_kehoachhangve_draftid] ?? order.crdfd_soluong;
        await apiService.updateDraftOrderStatus(
          order.crdfd_kehoachhangve_draftid, 
          191920001, // Đã xác nhận
          confirmedQuantity, // Sử dụng số lượng đã nhập hoặc số lượng ban đầu
          order.crdfd_soluong,
          notes, // Truyền ghi chú
          deliveryDate ? deliveryDate.toISOString() : undefined // Truyền ngày giao đã chọn
        );
      }
      
      const updatedItems = orders.map(item => ({
        id: item.crdfd_kehoachhangve_draftid,
        quantity: quantities[item.crdfd_kehoachhangve_draftid] ?? item.crdfd_soluong,
        deliveryDate: deliveryDates[item.crdfd_kehoachhangve_draftid] ? 
          deliveryDates[item.crdfd_kehoachhangve_draftid].toISOString() : 
          new Date().toISOString()
      }));
      const orderIds = orders.map(item => item.crdfd_kehoachhangve_draftid);
      onConfirm(orderIds, updatedItems, notes);
    } catch (error) {
      console.error('Error confirming orders:', error);
      alert('Có lỗi xảy ra khi xác nhận đơn hàng');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsLoading(true);
      
      // Cập nhật trạng thái crdfd_ncc_nhan_don cho tất cả đơn hàng trong nhóm
      for (const order of orders) {
        const confirmedQuantity = quantities[order.crdfd_kehoachhangve_draftid] ?? 0;
        await apiService.updateDraftOrderStatus(
          order.crdfd_kehoachhangve_draftid, 
          191920002, // Từ chối nhận đơn
          confirmedQuantity, // Sử dụng số lượng đã nhập hoặc 0
          order.crdfd_soluong
        );
      }
      
      const orderIds = orders.map(item => item.crdfd_kehoachhangve_draftid);
      onReject(orderIds);
    } catch (error) {
      console.error('Error rejecting orders:', error);
      alert('Có lỗi xảy ra khi từ chối đơn hàng');
    } finally {
      setIsLoading(false);
    }
  };

  // Get common info from the first order in the group
  const firstOrder = orders[0];
  if (!firstOrder) {
    return <Box className="p-4 text-red-600">Không tìm thấy thông tin đơn hàng.</Box>;
  }

  return (
    <Box className="bg-gray-50 min-h-screen">
      <Header
        title="Chi tiết đơn hàng"
        subtitle={`Đơn hàng của ${firstOrder.crdfd_nhanvienmuahang}`}
        showBackButton={true}
        onBack={onBack}
      />

      <Box className="page-container">
        {/* Order Info - Elevated to top with subtle background */}
        <Box className="modern-card elevated section-spacing fade-in">
          <Box className="p-4">
            <Text className="text-heading mb-3" style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
              Thông tin đơn hàng
            </Text>
            <Box className="space-y-2">
              <Box className="flex items-center justify-between">
                <Text className="text-gray-500 text-xs font-medium uppercase tracking-wide">Nhân viên mua hàng</Text>
                <Text className="text-gray-700 text-sm font-medium">{firstOrder.crdfd_nhanvienmuahang}</Text>
              </Box>
              <Box className="flex items-center justify-between">
                <Text className="text-gray-500 text-xs font-medium uppercase tracking-wide">Ngày gửi</Text>
                <Text className="text-gray-700 text-sm font-medium">{formatDate(firstOrder.createdon)}</Text>
              </Box>
              <Box className="flex items-center justify-between">
                <Text className="text-gray-500 text-xs font-medium uppercase tracking-wide">Trạng thái</Text>
                <Box 
                  className="px-2 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: getOrderStatusDisplay(firstOrder.crdfd_ncc_nhan_don).bgColor,
                    color: getOrderStatusDisplay(firstOrder.crdfd_ncc_nhan_don).color
                  }}
                >
                  {getOrderStatusDisplay(firstOrder.crdfd_ncc_nhan_don).text}
                </Box>
              </Box>
              {firstOrder.crdfd_ngay_xac_nhan_ncc && (
                <Box className="flex items-center justify-between">
                  <Text className="text-gray-500 text-xs font-medium uppercase tracking-wide">Ngày xác nhận</Text>
                  <Text className="text-gray-700 text-sm font-medium">{formatDate(firstOrder.crdfd_ngay_xac_nhan_ncc)}</Text>
                </Box>
              )}


            </Box>
          </Box>
        </Box>

        {/* Product Details - Optimized spacing and layout */}
        <Box className="modern-card section-spacing slide-up">
          <Box className="p-4">
            <Box className="mb-4">
              <Text className="text-heading mb-2" style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                Thông tin sản phẩm cần xác nhận
              </Text>
              <Text className="text-gray-500 text-xs font-medium uppercase tracking-wide">
                {orders.length} sản phẩm
              </Text>
            </Box>
            
            {orders.map((item, index) => (
              <Box key={item.crdfd_kehoachhangve_draftid} className={`pb-4 p-3 border border-gray-200 rounded-xl bg-white shadow-sm mb-4`} style={{ borderLeft: '4px solid #04A1B3' }}>
                {/* Product Header */}
                <Box className="mb-3">
                  <Text className="text-gray-900 font-semibold mb-2" style={{ fontSize: '15px' }}>
                    {item.cr1bb_tensanpham}
                  </Text>
                  <Box className="flex items-center justify-between">
                    <Text className="text-gray-500 text-xs font-medium uppercase tracking-wide">Đơn giá</Text>
                    <Text className="text-green-600 text-sm font-semibold">
                      {formatCurrency(item.crdfd_gia)}
                    </Text>
                  </Box>
                </Box>

                {/* Quantity Section */}
                <Box className="mb-3">
                  <Text className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-2 block">
                    Số lượng ({item.cr1bb_onvical})
                  </Text>
                  <Box className="flex items-center gap-3">
                    <Input
                      type="number"
                      value={getDisplayValue(item.crdfd_kehoachhangve_draftid, item.crdfd_soluong)}
                      onChange={(e) => handleQuantityChange(item.crdfd_kehoachhangve_draftid, e.target.value)}
                      className="flex-1"
                      size="medium"
                      min={0}
                      max={item.crdfd_soluong}
                      style={{
                        borderColor: quantityErrors[item.crdfd_kehoachhangve_draftid] ? '#EF4444' : undefined
                      }}
                    />
                    <Button
                      size="small"
                      variant="secondary"
                      onClick={() => handleOutOfStock(item.crdfd_kehoachhangve_draftid)}
                      style={{ 
                        height: '44px', 
                        padding: '0 12px',
                        backgroundColor: '#04A1B3',
                        borderColor: '#04A1B3',
                        color: '#FFFFFF'
                      }}
                    >
                      Hết hàng
                    </Button>
                  </Box>
                  {quantityErrors[item.crdfd_kehoachhangve_draftid] && (
                    <Text className="text-red-500 text-xs mt-1">
                      {quantityErrors[item.crdfd_kehoachhangve_draftid]}
                    </Text>
                  )}
                </Box>

                {/* Delivery Date Section */}
                <Box className="mb-3">
                  <Text className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-2 block">
                    Ngày giao
                  </Text>
                  <DatePicker
                    value={deliveryDates[item.crdfd_kehoachhangve_draftid] || new Date()}
                    onChange={(date) => handleDateChange(item.crdfd_kehoachhangve_draftid, date)}
                    placeholder="dd/MM/yyyy"
                  />
                </Box>

              </Box>
            ))}
          </Box>
        </Box>

        {/* Notes - Simplified border and clear placeholder */}
        <Box className="modern-card section-spacing slide-up">
          <Box className="p-3">
            <Text className="text-heading mb-2" style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
              Ghi chú
            </Text>
            <Input
              placeholder="Thêm ghi chú về đơn hàng..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              size="medium"
            />
          </Box>
        </Box>

        {/* Action Buttons - Modern design */}
        <Box className="flex gap-4 mb-6 pb-20 justify-center">
          <Button
            size="large"
            variant="secondary"
            onClick={handleReject}
            disabled={isLoading}
            style={{
              backgroundColor: '#F87171',
              borderColor: '#F87171',
              color: '#FFFFFF',
              fontWeight: '600',
              maxWidth: '200px'
            }}
          >
            {isLoading ? <Spinner /> : 'Từ chối đơn hàng'}
          </Button>
          <Button
            size="large"
            variant="primary"
            onClick={handleConfirm}
            disabled={isLoading}
            style={{
              backgroundColor: '#04A1B3',
              borderColor: '#04A1B3',
              color: '#FFFFFF',
              fontWeight: '600',
              maxWidth: '200px'
            }}
          >
            {isLoading ? <Spinner /> : 'Xác nhận đơn hàng'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default DraftOrderDetail;
