import { Box, Text, Button } from "zmp-ui";
import React from "react";
import Header from "./header";
import { DraftOrder } from "../services/api";

export interface HomeDashboardProps {
  onViewAllOrders: () => void;
  supplierName?: string;
  urgentCount?: number;
  allDraftOrders?: DraftOrder[];
  [key: string]: any;
}

const HomeDashboard: React.FC<HomeDashboardProps> = ({ onViewAllOrders, supplierName, urgentCount = 0, allDraftOrders = [] }) => {
  const currentDate = new Date().toLocaleDateString('vi-VN', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Tính toán đơn hàng giao hôm nay (có ngày xác nhận giao = hôm nay)
  const todayDeliveryOrders = allDraftOrders.filter(order => {
    if (!order.crdfd_xac_nhan_ngay_giao_ncc) return false;
    
    try {
      const deliveryDate = new Date(order.crdfd_xac_nhan_ngay_giao_ncc);
      const today = new Date();
      
      // So sánh ngày (bỏ qua thời gian) - cách 1
      const isToday = deliveryDate.getFullYear() === today.getFullYear() &&
                     deliveryDate.getMonth() === today.getMonth() &&
                     deliveryDate.getDate() === today.getDate();
      
      // So sánh ngày - cách 2 (fallback)
      const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD
      const deliveryString = deliveryDate.toISOString().split('T')[0];
      const isTodayAlt = todayString === deliveryString;
      
      const finalResult = isToday || isTodayAlt;
      
      return finalResult;
    } catch (error) {
      console.error('Error parsing delivery date:', error, order.crdfd_xac_nhan_ngay_giao_ncc);
      return false;
    }
  });

  // Tính toán đơn hàng sắp đến hạn giao (trong 3 ngày tới)
  const upcomingDeliveryOrders = allDraftOrders.filter(order => {
    if (!order.crdfd_xac_nhan_ngay_giao_ncc) return false;
    
    try {
      const deliveryDate = new Date(order.crdfd_xac_nhan_ngay_giao_ncc);
      const today = new Date();
      const threeDaysFromNow = new Date(today);
      threeDaysFromNow.setDate(today.getDate() + 3);
      
      // Chỉ lấy đơn hàng đã xác nhận (crdfd_ncc_nhan_don = 191920001)
      return order.crdfd_ncc_nhan_don === 191920001 &&
             deliveryDate > today && 
             deliveryDate <= threeDaysFromNow;
    } catch (error) {
      return false;
    }
  });

  // Format thời gian cho lịch giao hàng
  const formatDeliveryTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      // Nếu chỉ có ngày (không có thời gian), hiển thị "Hôm nay"
      if (date.getHours() === 0 && date.getMinutes() === 0) {
        return "Hôm nay";
      }
      return date.toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      return "Hôm nay";
    }
  };

  // Format ngày cho hiển thị
  const formatDeliveryDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  };

  return (
    <Box className="bg-gray-50 min-h-screen pb-20">
      {/* Header */}
      <Header
        title="Wecare Group JSC"
        subtitle="Siêu thị công nghiệp"
        rightAction={{
          icon: "zi-notification",
          onClick: () => alert("Thông báo")
        }}
      />

      {/* Spacing */}
      <Box className="h-4"></Box>

      {/* Greeting */}
      <Box className="bg-white rounded-lg p-4 mb-4 mx-4 shadow-sm">
        <Text className="text-gray-900 font-semibold mb-2" style={{ fontSize: '18px' }}>
          👋 Chào mừng, {supplierName || 'Nhà cung cấp'}!
        </Text>
        <Text className="text-gray-600" style={{ fontSize: '14px' }}>
          {currentDate}
        </Text>
      </Box>

      {/* Alerts */}
      <Box className="bg-white rounded-lg p-4 mb-4 mx-4 shadow-sm">
        <Text className="text-gray-900 font-semibold mb-3" style={{ fontSize: '16px' }}>
          🔔 Thông báo quan trọng
        </Text>
        <Box className="space-y-3">
          <Box className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
            <Text style={{ fontSize: '16px' }}>🔴</Text>
            <Box className="flex-1">
              <Text className="text-red-800 font-medium" style={{ fontSize: '14px' }}>
                Khẩn cấp: {urgentCount} đơn hàng đang chờ xác nhận
              </Text>
              <Text className="text-red-600" style={{ fontSize: '12px' }}>
                {urgentCount > 0 ? 'Vui lòng kiểm tra và phản hồi sớm' : 'Chưa có đơn gấp'}
              </Text>
            </Box>
          </Box>
          
          <Box className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
            <Text style={{ fontSize: '16px' }}>🟡</Text>
            <Box className="flex-1">
              <Text className="text-yellow-800 font-medium" style={{ fontSize: '14px' }}>
                Nhắc nhở: {upcomingDeliveryOrders.length} đơn hàng sắp đến hạn giao
              </Text>
              <Text className="text-yellow-600" style={{ fontSize: '12px' }}>
                {upcomingDeliveryOrders.length > 0 ? 'Vui lòng chuẩn bị giao hàng sớm' : 'Chưa có đơn hàng sắp đến hạn'}
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Today Schedule */}
      <Box className="bg-white rounded-lg p-4 mb-4 mx-4 shadow-sm">
        <Text className="text-gray-900 font-semibold mb-3" style={{ fontSize: '16px' }}>
          📅 Lịch giao hàng hôm nay
        </Text>
        
        {todayDeliveryOrders.length > 0 ? (
          <Box className="space-y-3">
            {todayDeliveryOrders.map((order, index) => (
              <Box key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Box className="flex-1">
                  <Text className="font-medium" style={{ fontSize: '14px' }}>
                    {order.cr1bb_tensanpham || 'Sản phẩm không có tên'}
                  </Text>
                  <Text className="text-gray-600" style={{ fontSize: '12px' }}>
                    {order.crdfd_nhanvienmuahang} • {order.crdfd_xac_nhan_so_luong_ncc || order.crdfd_soluong} {order.cr1bb_onvical}
                  </Text>
                </Box>
                <Box>
                  <Text style={{ fontSize: '16px' }}>📦</Text>
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          <Box className="text-center py-4">
            <Text className="text-gray-500" style={{ fontSize: '14px' }}>
              Không có lịch giao hàng hôm nay
            </Text>
          </Box>
        )}
      </Box>

      {/* View All Orders Button */}
      <Box className="px-4 mb-4">
        <Button 
          onClick={onViewAllOrders}
          variant="primary"
          className="w-full"
          style={{
            backgroundColor: '#04A1B3',
            borderColor: '#04A1B3',
            color: 'white'
          }}
        >
          📦 Xem tất cả đơn hàng
        </Button>
      </Box>

      {/* Tips */}
      <Box className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 mb-4 mx-4 border border-blue-200">
        <Text className="text-blue-800 font-semibold mb-2" style={{ fontSize: '14px' }}>
          💡 Mẹo hôm nay
        </Text>
        <Text className="text-blue-700" style={{ fontSize: '13px', fontStyle: 'italic' }}>
          Xác nhận đơn hàng trong 30 phút để tăng độ tin cậy và cải thiện xếp hạng nhà cung cấp.
        </Text>
      </Box>
    </Box>
  );
};

export default HomeDashboard;