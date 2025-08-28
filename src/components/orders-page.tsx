import { Box, Text, Button, Spinner, Input, DatePicker } from "zmp-ui";
import { useState, useEffect, memo, useCallback, useMemo, useRef } from "react";
import type React from "react";
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
  const [quantities, setQuantities] = useState<{[key: string]: string}>({});
  const [rejectReasons, setRejectReasons] = useState<{[key: string]: string}>({});
  const quantityRefs = useRef<{[key: string]: string}>({});
  const [rejectReasonErrors, setRejectReasonErrors] = useState<{[key: string]: string}>({});


  // Lọc đơn hàng theo loại - chỉ hiển thị đơn chưa xác nhận (memoized)
  const { allOrders, urgentOrders } = useMemo(() => {
    const pending = orders.filter(order => 
      order.crdfd_ncc_nhan_don === 191920000 || 
      order.crdfd_ncc_nhan_don === null || 
      order.crdfd_ncc_nhan_don === undefined
    );
    return {
      allOrders: pending,
      urgentOrders: pending.filter(order => order.crdfd_urgent_type === 1),
    };
  }, [orders]);

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

  // Đã bỏ validation số lượng theo yêu cầu

  // Hàm xử lý thay đổi số lượng (không validate)
  const handleQuantityInput = useCallback((value: string, orderId: string) => {
    quantityRefs.current[orderId] = value;
  }, []);
  const handleQuantityBlur = useCallback((orderId: string) => {
    const v = quantityRefs.current[orderId];
    if (v !== undefined) {
      setQuantities(prev => ({ ...prev, [orderId]: v }));
    }
  }, []);

  const handleConfirmOrder = useCallback(async (order: DraftOrder) => {
    try {
      // Lấy giá trị từ state
      const quantityStr = quantityRefs.current[order.crdfd_kehoachhangve_draftid] ?? quantities[order.crdfd_kehoachhangve_draftid];
      const quantity = (quantityStr !== undefined && quantityStr !== '')
        ? parseInt(quantityStr, 10)
        : order.crdfd_soluong;
      
      // Bỏ kiểm tra lỗi số lượng
      
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
      
      // Chỉ kiểm tra lỗi ngày giao
      if (deliveryDateErrors[order.crdfd_kehoachhangve_draftid]) {
        setToast({
          message: 'Vui lòng sửa lỗi ngày giao trước khi xác nhận',
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
      
      // Xóa quantity khỏi state
      setQuantities(prev => {
        const newQuantities = { ...prev };
        delete newQuantities[order.crdfd_kehoachhangve_draftid];
        return newQuantities;
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
  }, [deliveryDates, deliveryDateErrors, quantities]);

  // Tối ưu hóa callback functions để tránh re-render
  const handleRejectReasonChange = useCallback((value: string, orderId: string) => {
    setRejectReasons(prev => {
      // Chỉ cập nhật nếu giá trị thực sự thay đổi
      if (prev[orderId] === value) return prev;
      return { ...prev, [orderId]: value };
    });
    
    // Xóa lỗi khi user bắt đầu nhập
    if (value.trim()) {
      setRejectReasonErrors(prev => {
        if (!prev[orderId]) return prev;
        const newErrors = { ...prev };
        delete newErrors[orderId];
        return newErrors;
      });
    }
  }, []);

  const handleRejectOrder = useCallback(async (order: DraftOrder) => {
    const rejectReason = rejectReasons[order.crdfd_kehoachhangve_draftid] || '';
    
    // Kiểm tra lý do từ chối
    if (!rejectReason.trim()) {
      setRejectReasonErrors(prev => ({
        ...prev,
        [order.crdfd_kehoachhangve_draftid]: 'Vui lòng nhập lý do từ chối'
      }));
      return;
    }

    // Xác nhận trước khi từ chối
    const confirmReject = window.confirm(
      `Bạn có chắc chắn muốn từ chối đơn hàng này?\n\nLý do: ${rejectReason}\n\nLý do này sẽ được lưu vào ghi chú trong hệ thống.`
    );
    
    if (!confirmReject) {
      return;
    }

    try {
      await apiService.updateDraftOrderStatus(
        order.crdfd_kehoachhangve_draftid,
        191920002,
        0,
        order.crdfd_soluong,
        rejectReason.trim()
      );
      
      setOrders(prevOrders => 
        prevOrders.filter(o => o.crdfd_kehoachhangve_draftid !== order.crdfd_kehoachhangve_draftid)
      );
      
      // Xóa quantity khỏi state
      setQuantities(prev => {
        const newQuantities = { ...prev };
        delete newQuantities[order.crdfd_kehoachhangve_draftid];
        return newQuantities;
      });
      
      // Xóa lý do từ chối và lỗi
      setRejectReasons(prev => {
        const newReasons = { ...prev };
        delete newReasons[order.crdfd_kehoachhangve_draftid];
        return newReasons;
      });
      setRejectReasonErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[order.crdfd_kehoachhangve_draftid];
        return newErrors;
      });
      
      setToast({
        message: `Đã từ chối đơn hàng thành công!\n\nLý do: ${rejectReason}`,
        type: 'success',
        isVisible: true
      });
    } catch (error) {
      console.error('Error rejecting order:', error);
      setToast({
        message: 'Có lỗi xảy ra khi từ chối đơn hàng. Vui lòng thử lại.',
        type: 'error',
        isVisible: true
      });
    }
  }, [rejectReasons]);

  // Input Số lượng tách riêng để tránh mất focus khi re-render
  const QuantityInput = memo(({ orderId, defaultValue, onInputValue, onBlurSync }: {
    orderId: string;
    defaultValue: string;
    onInputValue: (value: string, orderId: string) => void;
    onBlurSync: (orderId: string) => void;
  }) => {
    const [localValue, setLocalValue] = useState(defaultValue);
    
    // Cập nhật localValue khi defaultValue thay đổi
    useEffect(() => {
      setLocalValue(defaultValue);
    }, [defaultValue]);

    return (
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        pattern="[0-9]*"
        value={localValue}
        onChange={(e: React.FormEvent<HTMLInputElement>) => {
          const digitsOnly = e.currentTarget.value.replace(/\D+/g, '');
          setLocalValue(digitsOnly);
          onInputValue(digitsOnly, orderId);
        }}
        onBlur={() => onBlurSync(orderId)}
        style={{
          width: '100%',
          height: '40px',
          fontSize: '14px',
          border: '3px solid #6B7280',
          borderRadius: '8px',
          backgroundColor: '#ffffff',
          textAlign: 'right',
          padding: '8px 12px',
          outline: 'none',
          boxSizing: 'border-box'
        }}
      />
    );
  });

  QuantityInput.displayName = 'QuantityInput';

  // Input Lý do từ chối tách riêng để tránh mất focus khi re-render
  const RejectReasonInput = memo(({ orderId, defaultValue, onValueChange, hasError }: {
    orderId: string;
    defaultValue: string;
    onValueChange: (value: string, orderId: string) => void;
    hasError: boolean;
  }) => {
    const [localValue, setLocalValue] = useState(defaultValue);
    const orderIdRef = useRef(orderId);
    const defaultValueRef = useRef(defaultValue);
    const timeoutRef = useRef<number>();
    const onValueChangeRef = useRef(onValueChange);
    
    // Cập nhật ref khi callback thay đổi
    useEffect(() => {
      onValueChangeRef.current = onValueChange;
    }, [onValueChange]);
    
    // Chỉ cập nhật localValue khi orderId thay đổi (đơn hàng khác)
    useEffect(() => {
      if (orderIdRef.current !== orderId) {
        orderIdRef.current = orderId;
        defaultValueRef.current = defaultValue;
        setLocalValue(defaultValue);
      }
    }, [orderId, defaultValue]);

    // Tối ưu hóa onChange handler để tránh re-render
    const handleChange = useCallback((e: React.FormEvent<HTMLInputElement>) => {
      const value = e.currentTarget.value;
      setLocalValue(value);
      
      // Clear timeout cũ nếu có
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Debounce để tránh gọi onValueChange quá nhiều
      timeoutRef.current = setTimeout(() => {
        onValueChangeRef.current(value, orderId);
      }, 500); // Tăng delay lên 500ms để giảm thiểu re-render
    }, [orderId]);

    // Tối ưu hóa onBlur để cập nhật giá trị cuối cùng
    const handleBlur = useCallback(() => {
      // Clear timeout nếu có
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      onValueChangeRef.current(localValue, orderId);
    }, [localValue, orderId]);

    // Cleanup timeout khi component unmount
    useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    // Tối ưu hóa style object để tránh tạo mới mỗi lần render
    const inputStyle = useMemo(() => ({
      width: '100%',
      height: '40px',
      fontSize: '14px',
      border: `1px solid ${hasError ? '#DC2626' : '#D1D5DB'}`,
      borderRadius: '8px',
      backgroundColor: '#ffffff',
      padding: '8px 12px',
      outline: 'none',
      boxSizing: 'border-box' as const,
      borderWidth: hasError ? '2px' : '1px'
    }), [hasError]);

    return (
      <input
        type="text"
        placeholder="Nhập lý do từ chối đơn hàng (bắt buộc)..."
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        style={inputStyle}
      />
    );
  });

  RejectReasonInput.displayName = 'RejectReasonInput';

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
                    <QuantityInput
                      orderId={order.crdfd_kehoachhangve_draftid}
                      defaultValue={quantities[order.crdfd_kehoachhangve_draftid] ?? String(order.crdfd_soluong)}
                      onInputValue={handleQuantityInput}
                      onBlurSync={handleQuantityBlur}
                    />
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

              {/* Lý do từ chối */}
              <Box className="mb-4">
                <Text className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">
                  Lý do từ chối <span className="text-red-500">(*)</span>
                </Text>
                <RejectReasonInput
                  orderId={order.crdfd_kehoachhangve_draftid}
                  defaultValue={rejectReasons[order.crdfd_kehoachhangve_draftid] || ''}
                  onValueChange={handleRejectReasonChange}
                  hasError={rejectReasonErrors[order.crdfd_kehoachhangve_draftid] !== undefined}
                />
                {rejectReasonErrors[order.crdfd_kehoachhangve_draftid] && (
                  <Text className="text-red-500 text-xs mt-1 flex items-center">
                    <span style={{ marginRight: '4px' }}>⚠️</span>
                    {rejectReasonErrors[order.crdfd_kehoachhangve_draftid]}
                  </Text>
                )}
              </Box>

              {/* Action Buttons */}
              <Box className="flex gap-3 pt-1">
                <Button 
                  variant="tertiary" 
                  className="flex-1 h-11 rounded-lg border text-sm"
                  disabled={!rejectReasons[order.crdfd_kehoachhangve_draftid]?.trim()}
                  style={{ 
                    backgroundColor: !rejectReasons[order.crdfd_kehoachhangve_draftid]?.trim() ? '#F3F4F6' : '#ffffff', 
                    borderColor: !rejectReasons[order.crdfd_kehoachhangve_draftid]?.trim() ? '#9CA3AF' : '#DC2626', 
                    color: !rejectReasons[order.crdfd_kehoachhangve_draftid]?.trim() ? '#9CA3AF' : '#DC2626', 
                    borderWidth: 1, 
                    borderStyle: 'solid',
                    cursor: !rejectReasons[order.crdfd_kehoachhangve_draftid]?.trim() ? 'not-allowed' : 'pointer'
                  }}
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
