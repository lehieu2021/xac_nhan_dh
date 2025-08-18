import { Box, Text, Button, Spinner, Input } from "zmp-ui";
import { useState, useEffect } from "react";
import Header from "./header";
import { DraftOrder, apiService } from "../services/api";
import DraftOrderDetail from "./draft-order-detail";

interface OrdersPageProps {
  supplierCode: string;
  onBack: () => void;
  allDraftOrders?: DraftOrder[];
}

interface GroupedOrders {
  [key: string]: DraftOrder[];
}

const OrdersPage = ({ supplierCode, onBack, allDraftOrders }: OrdersPageProps) => {
  const [orders, setOrders] = useState<DraftOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrderGroup, setSelectedOrderGroup] = useState<DraftOrder[] | null>(null);

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

  const filteredOrders = orders; // Bỏ filter vì đã bỏ search

  // Group orders by employee and date
  const groupedOrders: GroupedOrders = {};
  filteredOrders.forEach(order => {
    const date = new Date(order.createdon).toLocaleDateString('vi-VN');
    const key = `${order.crdfd_nhanvienmuahang} - ${date}`;
    if (!groupedOrders[key]) {
      groupedOrders[key] = [];
    }
    groupedOrders[key].push(order);
  });

  // Debug: Log số lượng đơn hàng trong OrdersPage
  console.log('=== ORDERS PAGE DEBUG ===');
  console.log('OrdersPage - Total orders:', orders.length);
  console.log('OrdersPage - Filtered orders:', filteredOrders.length);
  console.log('OrdersPage - Grouped orders:', Object.keys(groupedOrders).length);

  const handleViewDetails = (orders: DraftOrder[]) => {
    setSelectedOrderGroup(orders);
  };

  const handleBackFromDetail = () => {
    setSelectedOrderGroup(null);
  };

  const handleConfirmOrder = async (
    orderIds: string[],
    updatedItems: { id: string; quantity: number; deliveryDate: string }[],
    notes: string
  ) => {
    try {
      // Cập nhật trạng thái crdfd_ncc_nhan_don cho tất cả đơn hàng
      for (const orderId of orderIds) {
        const updatedItem = updatedItems.find(item => item.id === orderId);
        const originalOrder = orders.find(order => order.crdfd_kehoachhangve_draftid === orderId);
        
        if (updatedItem && originalOrder) {
                     await apiService.updateDraftOrderStatus(
             orderId, 
             191920001, // Đã xác nhận
             updatedItem.quantity,
             originalOrder.crdfd_soluong,
             notes, // Truyền ghi chú
             updatedItem.deliveryDate // Truyền ngày giao
           );
        }
      }
      
      alert('Đã xác nhận đơn hàng thành công!');
      setSelectedOrderGroup(null);
      loadOrders(); // Refresh orders
    } catch (error) {
      console.error('Error confirming order:', error);
      alert('Có lỗi xảy ra khi xác nhận đơn hàng');
    }
  };

  const handleRejectOrder = async (orderIds: string[]) => {
    try {
      // Cập nhật trạng thái crdfd_ncc_nhan_don cho tất cả đơn hàng
      for (const orderId of orderIds) {
        const originalOrder = orders.find(order => order.crdfd_kehoachhangve_draftid === orderId);
        
        if (originalOrder) {
          await apiService.updateDraftOrderStatus(
            orderId, 
            191920002, // Từ chối nhận đơn
            0, // Số lượng xác nhận = 0 (hết hàng)
            originalOrder.crdfd_soluong
          );
        }
      }
      
      alert('Đã từ chối đơn hàng!');
      setSelectedOrderGroup(null);
      loadOrders(); // Refresh orders
    } catch (error) {
      console.error('Error rejecting order:', error);
      alert('Có lỗi xảy ra khi từ chối đơn hàng');
    }
  };

  const getStatusColor = (order: DraftOrder) => {
    const deliveryDate = new Date(order.cr1bb_ngaygiaodukien);
    const today = new Date();
    const diffDays = Math.ceil((deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'text-red-600 bg-red-50';
    if (diffDays <= 3) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getStatusText = (order: DraftOrder) => {
    const deliveryDate = new Date(order.cr1bb_ngaygiaodukien);
    const today = new Date();
    const diffDays = Math.ceil((deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Quá hạn';
    if (diffDays === 0) return 'Giao hôm nay';
    if (diffDays <= 3) return `Còn ${diffDays} ngày`;
    return 'Đúng hạn';
  };

  // Helper function để hiển thị trạng thái NCC nhận đơn
  const getNCCStatusDisplay = (status?: number) => {
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

  if (selectedOrderGroup) {
    return (
      <DraftOrderDetail
        orders={selectedOrderGroup}
        onBack={handleBackFromDetail}
        onConfirm={handleConfirmOrder}
        onReject={handleRejectOrder}
      />
    );
  }

     if (loading) {
     return (
       <Box className="bg-gray-50 min-h-screen">
         <Header
           title="Đơn hàng"
           subtitle="Danh sách đơn hàng"
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
           title="Đơn hàng"
           subtitle="Danh sách đơn hàng"
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
             {/* Header */}
       <Header
         title="Đơn hàng"
         subtitle="Danh sách đơn hàng"
         showBackButton={true}
         onBack={onBack}
       />

      

      {/* Stats */}
      <Box className="px-4 mb-4">
        <Box className="bg-white rounded-lg p-4 shadow-sm">
          <Text className="text-gray-900 font-semibold mb-3" style={{ fontSize: '16px' }}>
            📊 Thống kê
          </Text>
                                           <Box className="grid grid-cols-4 gap-3">
             <Box className="text-center">
               <Text className="text-xl font-bold text-blue-600">
                 {Object.keys(groupedOrders).length}
               </Text>
               <Text className="text-xs text-gray-600">Tổng đơn</Text>
             </Box>
             <Box className="text-center">
               <Text className="text-xl font-bold text-green-600">
                 {Object.values(groupedOrders).filter(group => {
                   const firstOrder = group[0];
                   // Đơn đã xác nhận (bao gồm cả từ chối)
                   return (firstOrder.crdfd_ncc_nhan_don === 191920001 || 
                           firstOrder.crdfd_ncc_nhan_don === 191920002);
                 }).length}
               </Text>
               <Text className="text-xs text-gray-600">Đã xử lý</Text>
             </Box>
                           <Box className="text-center">
               <Text className="text-xl font-bold text-orange-600">
                 {Object.values(groupedOrders).filter(group => {
                   const firstOrder = group[0];
                   // Đơn mới gửi hôm nay và chưa xử lý
                   const orderDate = new Date(firstOrder.createdon);
                   const today = new Date();
                   const isToday = orderDate.toDateString() === today.toDateString();
                   const isPending = (firstOrder.crdfd_ncc_nhan_don === 191920000 || 
                                     firstOrder.crdfd_ncc_nhan_don === null || 
                                     firstOrder.crdfd_ncc_nhan_don === undefined);
                   
                   return isToday && isPending;
                 }).length}
               </Text>
                               <Text className="text-xs text-gray-600">Đơn mới</Text>
             </Box>
             <Box className="text-center">
               <Text className="text-xl font-bold text-red-600">
                 {Object.values(groupedOrders).filter(group => {
                   const firstOrder = group[0];
                   // Đơn chưa xác nhận và ngày tạo đơn trước hôm nay
                   const orderDate = new Date(firstOrder.createdon);
                   const today = new Date();
                   const diffDays = Math.ceil((orderDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                   
                   return (firstOrder.crdfd_ncc_nhan_don === 191920000 || 
                           firstOrder.crdfd_ncc_nhan_don === null || 
                           firstOrder.crdfd_ncc_nhan_don === undefined) &&
                          diffDays < 0;
                 }).length}
               </Text>
               <Text className="text-xs text-gray-600">Trễ xác nhận</Text>
             </Box>
          </Box>
        </Box>
      </Box>

      {/* Orders List */}
      <Box className="px-4 pb-20">
                 {Object.keys(groupedOrders).length === 0 ? (
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
                                           <Box className="space-y-6">
             {Object.entries(groupedOrders).map(([groupKey, groupOrders]) => (
               <Box key={groupKey}>
                 {/* Group Summary Card */}
                 <Box className="bg-white rounded-lg p-4 shadow-sm" style={{ borderLeft: '4px solid #04A1B3' }}>
                   {/* Group Info */}
                   <Box className="flex justify-between items-start mb-3">
                     <Box className="flex-1">
                       <Text className="font-semibold text-gray-900 mb-1" style={{ fontSize: '16px' }}>
                         {groupKey}
                       </Text>
                     </Box>
                     <Box className="flex flex-col items-end gap-2">
                       <Box className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(groupOrders[0])}`}>
                         {getStatusText(groupOrders[0])}
                       </Box>
                       <Box 
                         className="px-2 py-1 rounded-full text-xs font-medium"
                         style={{
                           backgroundColor: getNCCStatusDisplay(groupOrders[0].crdfd_ncc_nhan_don).bgColor,
                           color: getNCCStatusDisplay(groupOrders[0].crdfd_ncc_nhan_don).color
                         }}
                       >
                         {getNCCStatusDisplay(groupOrders[0].crdfd_ncc_nhan_don).text}
                       </Box>
                     </Box>
                   </Box>

                   {/* Summary Details */}
                   <Box className="grid grid-cols-2 gap-4 mb-3">
                     <Box>
                       <Text className="text-gray-500 text-xs mb-1">Số sản phẩm</Text>
                       <Text className="font-medium text-gray-900">
                         {groupOrders.length}
                       </Text>
                     </Box>
                     <Box>
                       <Text className="text-gray-500 text-xs mb-1">Tổng tiền</Text>
                       <Text className="font-bold text-lg text-gray-900">
                         {formatCurrency(groupOrders.reduce((sum, order) => sum + (order.crdfd_soluong * order.crdfd_gia), 0))}
                       </Text>
                     </Box>
                   </Box>
                   
                   {/* Ngày xác nhận nếu có */}
                   {groupOrders[0].crdfd_ngay_xac_nhan_ncc && (
                     <Box className="mb-3">
                       <Text className="text-gray-500 text-xs mb-1">Ngày xác nhận</Text>
                       <Text className="text-gray-700 text-sm font-medium">
                         {formatDate(groupOrders[0].crdfd_ngay_xac_nhan_ncc)}
                       </Text>
                     </Box>
                   )}
                    
                    
                     

                   {/* Actions */}
                   <Box className="mt-3 pt-3 border-t border-gray-100">
                                           <Button 
                        size="small" 
                        variant="secondary" 
                        className="w-full"
                        onClick={() => handleViewDetails(groupOrders)}
                        style={{
                          backgroundColor: '#F3F4F6',
                          borderColor: '#D1D5DB',
                          color: '#374151'
                        }}
                      >
                        Xem chi tiết
                      </Button>
                   </Box>
                 </Box>
              </Box>
            ))}
          </Box>
                 )}


       </Box>
     </Box>
   );
 };

export default OrdersPage;
