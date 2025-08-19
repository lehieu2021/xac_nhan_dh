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

  // Tính toán đơn hàng giao hôm nay
  const todayDeliveryOrders = allDraftOrders.filter(order => {
    if (!order.crdfd_xac_nhan_ngay_giao_ncc) return false;
    
    try {
      const deliveryDate = new Date(order.crdfd_xac_nhan_ngay_giao_ncc);
      const today = new Date();
      
      const isToday = deliveryDate.getFullYear() === today.getFullYear() &&
                     deliveryDate.getMonth() === today.getMonth() &&
                     deliveryDate.getDate() === today.getDate();
      
      const todayString = today.toISOString().split('T')[0];
      const deliveryString = deliveryDate.toISOString().split('T')[0];
      const isTodayAlt = todayString === deliveryString;
      
      return isToday || isTodayAlt;
    } catch (error) {
      return false;
    }
  });

  // Tính toán đơn hàng sắp đến hạn giao
  const upcomingDeliveryOrders = allDraftOrders.filter(order => {
    if (!order.crdfd_xac_nhan_ngay_giao_ncc) return false;
    
    try {
      const deliveryDate = new Date(order.crdfd_xac_nhan_ngay_giao_ncc);
      const today = new Date();
      const threeDaysFromNow = new Date(today);
      threeDaysFromNow.setDate(today.getDate() + 3);
      
      return order.crdfd_ncc_nhan_don === 191920001 &&
             deliveryDate > today && 
             deliveryDate <= threeDaysFromNow;
    } catch (error) {
      return false;
    }
  });

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

      {/* Greeting */}
      <Box className="bg-white rounded-xl p-4 mb-4 mx-4 shadow-sm border border-gray-100">
        <Text className="text-gray-900 font-medium mb-1 text-base">
          👋 Chào mừng, {supplierName || 'Nhà cung cấp'}!
        </Text>
        <Text className="text-gray-500 text-sm">
          {currentDate}
        </Text>
      </Box>

      {/* Quick Stats */}
      <Box className="px-4 mb-4">
        <Box className="grid grid-cols-2 gap-3">
          <Box className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <Text className="text-2xl mb-1">📦</Text>
            <Text className="text-lg font-semibold text-gray-900">{urgentCount}</Text>
            <Text className="text-xs text-gray-500">Đơn chờ xác nhận</Text>
          </Box>
          <Box className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <Text className="text-2xl mb-1">🚚</Text>
            <Text className="text-lg font-semibold text-gray-900">{todayDeliveryOrders.length}</Text>
            <Text className="text-xs text-gray-500">Giao hôm nay</Text>
          </Box>
        </Box>
      </Box>

      {/* Alerts */}
      {(urgentCount > 0 || upcomingDeliveryOrders.length > 0) && (
        <Box className="bg-white rounded-xl p-4 mb-4 mx-4 shadow-sm border border-gray-100">
          <Text className="text-gray-900 font-medium mb-3 text-base">
            🔔 Thông báo
          </Text>
          <Box className="space-y-2">
            {urgentCount > 0 && (
              <Box className="flex items-center space-x-2 p-2 bg-red-50 rounded-lg">
                <Text className="text-red-500">🔴</Text>
                <Text className="text-red-700 text-sm">
                  {urgentCount} đơn hàng cần xác nhận gấp
                </Text>
              </Box>
            )}
            
            {upcomingDeliveryOrders.length > 0 && (
              <Box className="flex items-center space-x-2 p-2 bg-yellow-50 rounded-lg">
                <Text className="text-yellow-500">🟡</Text>
                <Text className="text-yellow-700 text-sm">
                  {upcomingDeliveryOrders.length} đơn hàng sắp đến hạn giao
                </Text>
              </Box>
            )}
          </Box>
        </Box>
      )}

      {/* Today Schedule */}
      <Box className="bg-white rounded-xl p-4 mb-4 mx-4 shadow-sm border border-gray-100">
        <Text className="text-gray-900 font-medium mb-3 text-base">
          📅 Lịch giao hàng hôm nay
        </Text>
        
        {todayDeliveryOrders.length > 0 ? (
          <Box className="space-y-2">
            {todayDeliveryOrders.slice(0, 3).map((order, index) => (
              <Box key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                <Box className="flex-1">
                  <Text className="font-medium text-sm text-gray-900">
                    {order.cr1bb_tensanpham || 'Sản phẩm'}
                  </Text>
                  <Text className="text-gray-500 text-xs">
                    {order.crdfd_nhanvienmuahang} • {order.crdfd_xac_nhan_so_luong_ncc || order.crdfd_soluong} {order.cr1bb_onvical}
                  </Text>
                </Box>
                <Text className="text-gray-400">📦</Text>
              </Box>
            ))}
            {todayDeliveryOrders.length > 3 && (
              <Text className="text-center text-gray-500 text-xs pt-1">
                +{todayDeliveryOrders.length - 3} đơn hàng khác
              </Text>
            )}
          </Box>
        ) : (
          <Box className="text-center py-4">
            <Text className="text-gray-400 text-sm">
              Không có lịch giao hàng hôm nay
            </Text>
          </Box>
        )}
      </Box>

      {/* View All Orders Button */}
      <Box className="px-4 mb-4">
        <Button 
          onClick={onViewAllOrders}
          variant="tertiary"
          className="w-full h-12 rounded-lg font-medium"
          style={{ backgroundColor: '#ffffff', color: '#04A1B3', borderColor: '#04A1B3', borderWidth: 2, borderStyle: 'solid' }}
        >
          Xem tất cả đơn hàng
        </Button>
      </Box>

      {/* Tips */}
      <Box className="bg-blue-50 rounded-xl p-4 mb-4 mx-4 border border-blue-100">
        <Text className="text-blue-800 font-medium mb-1 text-sm">
          💡 Mẹo hôm nay
        </Text>
        <Text className="text-blue-700 text-xs leading-relaxed">
          Xác nhận đơn hàng trong 30 phút để tăng độ tin cậy và cải thiện xếp hạng nhà cung cấp.
        </Text>
      </Box>
    </Box>
  );
};

export default HomeDashboard;