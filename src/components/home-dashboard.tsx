import { Box, Text, Button } from "zmp-ui";
import React from "react";
import Header from "./header";

export interface HomeDashboardProps {
  onViewAllOrders: () => void;
  supplierName?: string;
  urgentCount?: number;
  [key: string]: any;
}

const HomeDashboard: React.FC<HomeDashboardProps> = ({ onViewAllOrders, supplierName, urgentCount = 0 }) => {
  const currentDate = new Date().toLocaleDateString('vi-VN', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });



  const todaySchedule = [
    { time: "9:00 AM", orderId: "DH001", customer: "Công ty ABC" },
    { time: "2:00 PM", orderId: "DH005", customer: "Công ty XYZ" },
    { time: "4:30 PM", orderId: "DH008", customer: "Công ty DEF" }
  ];

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
                Khẩn cấp: {urgentCount} đơn hàng cần xác nhận ngay
              </Text>
              <Text className="text-red-600" style={{ fontSize: '12px' }}>
                {urgentCount > 0 ? 'Vui lòng xử lý ngay' : 'Chưa có đơn gấp'}
              </Text>
            </Box>
          </Box>
          
          <Box className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
            <Text style={{ fontSize: '16px' }}>🟡</Text>
            <Box className="flex-1">
              <Text className="text-yellow-800 font-medium" style={{ fontSize: '14px' }}>
                Nhắc nhở: 5 đơn hàng sắp đến hạn giao
              </Text>
              <Text className="text-yellow-600" style={{ fontSize: '12px' }}>
                Cần chuẩn bị giao hàng trong 24h tới
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
        
        {todaySchedule.length > 0 ? (
          <Box className="space-y-3">
            {todaySchedule.map((item, index) => (
              <Box key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Box className="w-16 text-center">
                  <Text className="font-medium" style={{ fontSize: '12px', color: '#04A1B3' }}>
                    {item.time}
                  </Text>
                </Box>
                <Box className="flex-1">
                  <Text className="font-medium" style={{ fontSize: '14px' }}>
                    Giao {item.orderId}
                  </Text>
                  <Text className="text-gray-600" style={{ fontSize: '12px' }}>
                    {item.customer}
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