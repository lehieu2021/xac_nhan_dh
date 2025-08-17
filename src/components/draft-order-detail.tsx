import { Box, Text, Button, Input, Spinner, DatePicker } from "zmp-ui";
import { useState } from "react";
import Header from "./header";
import { DraftOrder } from "../services/api";

interface DraftOrderDetailProps {
  orders: DraftOrder[];
  onBack: () => void;
  onConfirm: (
    orderIds: string[],
    updatedItems: { id: string; quantity: number; deliveryDate: string }[],
    notes: string
  ) => void;
  onReject: (orderIds: string[], reason: string) => void;
}

const DraftOrderDetail = ({ orders, onBack, onConfirm, onReject }: DraftOrderDetailProps) => {
  // Initialize quantities for all items in the group
  const initialQuantities = orders.reduce((acc, item) => {
    acc[item.crdfd_kehoachhangve_draftid] = item.crdfd_soluong;
    return acc;
  }, {} as { [key: string]: number });
  const [quantities, setQuantities] = useState<{ [key: string]: number }>(initialQuantities);
  const [notes, setNotes] = useState("");
  const initialDeliveryDatesIso = orders.reduce((acc, item) => {
    const d = new Date(item.cr1bb_ngaygiaodukien);
    const tzAdjusted = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    acc[item.crdfd_kehoachhangve_draftid] = tzAdjusted.toISOString().slice(0, 10);
    return acc;
  }, {} as { [key: string]: string });
  
  const toVNDate = (iso: string) => {
    const [yyyy, mm, dd] = iso.split("-");
    return `${dd}/${mm}/${yyyy}`;
  };
  
  const fromVNDate = (vn: string): string | null => {
    const m = vn.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return null;
    const dd = m[1].padStart(2, '0');
    const mm = m[2].padStart(2, '0');
    const yyyy = m[3];
    return `${yyyy}-${mm}-${dd}`;
  };
  
  const initialDisplayDates = Object.entries(initialDeliveryDatesIso).reduce((acc, [k, v]) => {
    acc[k] = toVNDate(v);
    return acc;
  }, {} as { [key: string]: string });
  
  const [deliveryDatesIso, setDeliveryDatesIso] = useState<{ [key: string]: string }>(initialDeliveryDatesIso);
  const [displayDates, setDisplayDates] = useState<{ [key: string]: string }>(initialDisplayDates);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleQuantityChange = (orderId: string, newQuantity: number) => {
    setQuantities(prev => ({
      ...prev,
      [orderId]: Math.max(0, newQuantity)
    }));
  };

  const handleOutOfStock = (orderId: string) => {
    setQuantities(prev => ({
      ...prev,
      [orderId]: 0
    }));
  };

  const handleDateChange = (orderId: string, date: Date) => {
    // Convert Date to DD/MM/YYYY format for display
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const displayDate = `${day}/${month}/${year}`;
    
    setDisplayDates(prev => ({ ...prev, [orderId]: displayDate }));
    
    // Convert to ISO format for backend
    const isoDate = date.toISOString();
    setDeliveryDatesIso(prev => ({ ...prev, [orderId]: isoDate }));
  };

  const handleConfirm = async () => {
    const updatedItems = orders.map(item => ({
      id: item.crdfd_kehoachhangve_draftid,
      quantity: quantities[item.crdfd_kehoachhangve_draftid],
      deliveryDate: deliveryDatesIso[item.crdfd_kehoachhangve_draftid]
    }));
    const orderIds = orders.map(item => item.crdfd_kehoachhangve_draftid);
    onConfirm(orderIds, updatedItems, notes);
  };

  const handleReject = async () => {
    const reason = prompt('Lý do từ chối đơn hàng:');
    if (reason) {
      const orderIds = orders.map(item => item.crdfd_kehoachhangve_draftid);
      onReject(orderIds, reason);
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
                             value={quantities[item.crdfd_kehoachhangve_draftid]}
                             onChange={(e) => handleQuantityChange(item.crdfd_kehoachhangve_draftid, parseInt(e.target.value))}
                                                         className="flex-1"
                             size="medium"
                             min={0}
                             disabled={quantities[item.crdfd_kehoachhangve_draftid] === 0}
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
                 </Box>

                                                     {/* Delivery Date Section */}
                  <Box className="mb-3">
                    <Text className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-2 block">
                      Ngày giao
                    </Text>
                    <Box style={{ backgroundColor: '#FFFFFF', borderRadius: '8px' }}>
                      <DatePicker
                        value={displayDates[item.crdfd_kehoachhangve_draftid] ? new Date(displayDates[item.crdfd_kehoachhangve_draftid].split('/').reverse().join('-')) : new Date()}
                        onChange={(date) => handleDateChange(item.crdfd_kehoachhangve_draftid, date)}
                      />
                    </Box>
                                     </Box>

                   {/* Item Total Amount */}
                   <Box className="flex justify-between items-center py-2 border-t border-gray-100 mt-3">
                                           <Text className="text-gray-500 text-xs font-medium uppercase tracking-wide">Thành tiền:</Text>
                                           <Text className="font-semibold" style={{ color: '#059669', fontSize: '14px' }}>
                        {formatCurrency(quantities[item.crdfd_kehoachhangve_draftid] * item.crdfd_gia)}
                      </Text>
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

        {/* Total Amount - Highlighted */}
        <Box className="modern-card section-spacing scale-in">
          <Box className="p-3">
            <Box className="flex justify-between items-center">
                             <Text className="text-heading" style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>Tổng tiền</Text>
               <Text className="text-green-600 font-bold" style={{ fontSize: '16px' }}>
                {formatCurrency(orders.reduce((sum, item) => sum + (quantities[item.crdfd_kehoachhangve_draftid] * item.crdfd_gia), 0))}
              </Text>
            </Box>
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
