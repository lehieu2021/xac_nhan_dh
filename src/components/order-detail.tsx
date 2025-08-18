import { useState } from "react";
import { Box, Text, Button, Input, DatePicker } from "zmp-ui";
import Header from "./header";

interface OrderItem {
  crdfd_orderitemid: string;
  crdfd_productname: string;
  crdfd_requestedquantity: number;
  crdfd_confirmedquantity: number;
  crdfd_unitprice: number;
  crdfd_unit: string;
  crdfd_notes: string;
  crdfd_deliverydate: string;
}

interface OrderDetailProps {
  order: {
    crdfd_orderid: string;
    crdfd_ordernumber: string;
    crdfd_customername: string;
    crdfd_customerphone: string;
    crdfd_customeraddress: string;
    crdfd_orderdate: string;
    crdfd_requesteddeliverydate: string;
    crdfd_status: 'pending' | 'confirmed' | 'rejected';
    crdfd_totalamount: number;
    items?: OrderItem[];
    crdfd_suppliernotes: string;
  };
  onConfirm: (orderId: string, confirmedItems: OrderItem[], notes: string) => void;
  onReject: (orderId: string, reason: string) => void;
  onBack: () => void;
}

const OrderDetail = ({ order, onConfirm, onReject, onBack }: OrderDetailProps) => {
  const [confirmedItems, setConfirmedItems] = useState<OrderItem[]>(
    (order.items || []).map(item => ({ 
      ...item, 
      crdfd_confirmedquantity: item.crdfd_requestedquantity,
      crdfd_deliverydate: item.crdfd_deliverydate || order.crdfd_requesteddeliverydate
    }))
  );
  const [supplierNotes, setSupplierNotes] = useState(order.crdfd_suppliernotes);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleQuantityChange = (itemId: string, quantity: number) => {
    if (quantity >= 0 && !isNaN(quantity)) {
      setConfirmedItems(prev => 
        prev.map(item => 
          item.crdfd_orderitemid === itemId 
            ? { ...item, crdfd_confirmedquantity: quantity }
            : item
        )
      );
    }
  };

  const handleDeliveryDateChange = (itemId: string, newDate: Date) => {
    // Convert Date to DD/MM/YYYY format
    if (newDate) {
      const day = newDate.getDate().toString().padStart(2, '0');
      const month = (newDate.getMonth() + 1).toString().padStart(2, '0');
      const year = newDate.getFullYear();
      const formattedDate = `${day}/${month}/${year}`;
      
      setConfirmedItems(prev => 
        prev.map(item => 
          item.crdfd_orderitemid === itemId 
            ? { ...item, crdfd_deliverydate: formattedDate }
            : item
        )
      );
    }
  };

  const handleConfirm = () => {
    onConfirm(order.crdfd_orderid, confirmedItems, supplierNotes);
  };

  const handleReject = () => {
    if (rejectReason.trim()) {
      onReject(order.crdfd_orderid, rejectReason);
    }
  };

  const totalConfirmedAmount = confirmedItems.reduce(
    (sum, item) => sum + (item.crdfd_confirmedquantity * item.crdfd_unitprice), 
    0
  );

  return (
    <Box className="bg-gray-50 min-h-screen">
      {/* Header */}
      <Header
        title={`Đơn hàng #${order.crdfd_ordernumber}`}
        subtitle="Chi tiết đơn hàng"
        showBackButton={true}
        onBack={onBack}
      />

      {/* Order Info */}
      <Box className="bg-white rounded-lg p-4 mb-4 mx-4 shadow-sm">
        <Text className="text-gray-900 font-semibold mb-4" style={{ fontSize: '16px' }}>
          Thông tin đơn hàng
        </Text>
        <Box className="space-y-3">
                     <Box className="flex justify-between items-center">
             <Text className="text-gray-600" style={{ fontSize: '14px' }}>Nhân viên mua hàng:</Text>
             <Text className="text-gray-900 font-medium" style={{ fontSize: '14px' }}>{order.crdfd_customername}</Text>
           </Box>
           <Box className="flex justify-between items-center">
             <Text className="text-gray-600" style={{ fontSize: '14px' }}>SĐT liên hệ:</Text>
             <Text className="text-gray-900" style={{ fontSize: '14px' }}>{order.crdfd_customerphone}</Text>
           </Box>
           <Box className="flex justify-between items-center">
             <Text className="text-gray-600" style={{ fontSize: '14px' }}>Ngày đặt hàng:</Text>
             <Text className="text-gray-900" style={{ fontSize: '14px' }}>{order.crdfd_orderdate}</Text>
           </Box>
           <Box className="flex justify-between items-center">
             <Text className="text-gray-600" style={{ fontSize: '14px' }}>Ngày xác nhận:</Text>
             <Text className="text-gray-900" style={{ fontSize: '14px' }}>
               {order.crdfd_status === 'confirmed' ? new Date().toLocaleDateString('vi-VN') : 'Chưa xác nhận'}
             </Text>
           </Box>
           <Box className="flex justify-between items-center">
             <Text className="text-gray-600" style={{ fontSize: '14px' }}>Ngày giao dự kiến:</Text>
             <Text className="text-gray-900" style={{ fontSize: '14px' }}>
               {order.crdfd_requesteddeliverydate || 'Chưa có'}
             </Text>
           </Box>
        </Box>
      </Box>

      {/* Order Items */}
      <Box className="bg-white rounded-lg p-4 mb-4 mx-4 shadow-sm">
        <Text className="text-gray-900 font-semibold mb-4" style={{ fontSize: '16px' }}>
          Chi tiết sản phẩm
        </Text>
        
                          {confirmedItems.map((item, index) => (
            <Box key={item.crdfd_orderitemid} className="mb-6 p-4 border border-gray-200 rounded-xl bg-white shadow-sm" style={{ borderLeft: '4px solid #04A1B3' }}>
            {/* Product Name */}
                         <Text size="normal" className="font-semibold mb-4" style={{ color: '#04A1B3', fontSize: '16px' }}>
               {item.crdfd_productname}
             </Text>
            
            <Box className="space-y-3">
              {/* Unit Price */}
                             <Box className="flex justify-between items-center">
                 <Text className="text-gray-600" style={{ fontSize: '14px' }}>Đơn giá:</Text>
                 <Text className="text-gray-900 font-medium" style={{ fontSize: '14px' }}>
                   {item.crdfd_unitprice.toLocaleString('vi-VN')} VNĐ/{item.crdfd_unit}
                 </Text>
               </Box>
              
              {/* Requested Quantity */}
                             <Box className="flex justify-between items-center">
                 <Text className="text-gray-600" style={{ fontSize: '14px' }}>Số lượng yêu cầu:</Text>
                 <Text className="text-gray-900" style={{ fontSize: '14px' }}>{item.crdfd_requestedquantity} {item.crdfd_unit}</Text>
               </Box>
              
                             {/* Confirmed Quantity */}
                              <Box className="flex justify-between items-center">
                 <Text className="text-gray-600" style={{ fontSize: '14px' }}>Số lượng xác nhận:</Text>
                 <Box className="flex items-center space-x-2">
                   {order.crdfd_status === 'pending' ? (
                     <Input
                       type="number"
                       size="small"
                       value={item.crdfd_confirmedquantity}
                       onChange={(e) => handleQuantityChange(item.crdfd_orderitemid, parseInt(e.target.value) || 0)}
                       className="w-20 text-center"
                       style={{
                         height: '48px !important',
                         border: '1px solid #04A1B3 !important',
                         borderRadius: '8px !important',
                         fontSize: '14px !important',
                         padding: '4px 8px !important'
                       }}
                     />
                   ) : (
                     <Text className="text-gray-900 font-medium w-20 text-center" style={{ fontSize: '14px' }}>
                       {item.crdfd_confirmedquantity}
                     </Text>
                   )}
                   <Text className="text-gray-600" style={{ fontSize: '14px' }}>{item.crdfd_unit}</Text>
                   {order.crdfd_status !== 'pending' && item.crdfd_confirmedquantity === 0 && (
                     <Text className="text-red-600 font-medium" style={{ fontSize: '12px' }}>
                       (Hết hàng)
                     </Text>
                   )}
                 </Box>
               </Box>

                                               {/* Delivery Date */}
                <Box className="flex justify-between items-center">
                  <Text className="text-gray-600" style={{ fontSize: '14px' }}>Ngày giao:</Text>
                  <Box className="flex items-center space-x-2">
                                         {order.crdfd_status === 'pending' ? (
                                               <Box style={{ backgroundColor: '#FFFFFF', borderRadius: '8px' }}>
                          <DatePicker
                            value={item.crdfd_deliverydate ? new Date(item.crdfd_deliverydate.split('/').reverse().join('-')) : new Date()}
                            onChange={(date) => handleDeliveryDateChange(item.crdfd_orderitemid, date)}
                            placeholder="Chọn ngày giao hàng"
                          />
                        </Box>
                     ) : (
                      <Text className="text-gray-900 font-medium w-32 text-center" style={{ fontSize: '14px' }}>
                        {item.crdfd_deliverydate}
                      </Text>
                    )}
                  </Box>
                </Box>

                             {/* Out of Stock Button */}
                              {order.crdfd_status === 'pending' && (
                                   <Box className="flex justify-end mt-2">
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => handleQuantityChange(item.crdfd_orderitemid, 0)}
                      style={{
                        backgroundColor: '#04A1B3',
                        borderColor: '#04A1B3',
                        color: '#FFFFFF',
                        fontSize: '12px',
                        height: '28px',
                        padding: '4px 12px',
                        borderRadius: '6px'
                      }}
                    >
                      Hết hàng
                    </Button>
                  </Box>
               )}
               
               
               
                               {/* Item Total Amount */}
                <Box className="flex justify-between items-center py-2 border-t border-gray-100">
                                     <Text className="text-gray-600" style={{ fontSize: '14px' }}>Thành tiền:</Text>
                                     <Text className="font-semibold" style={{ color: '#059669', fontSize: '15px' }}>
                     {(item.crdfd_confirmedquantity * item.crdfd_unitprice).toLocaleString('vi-VN')} VNĐ
                   </Text>
                </Box>
            </Box>
          </Box>
        ))}
        
        <Box className="border-t border-gray-200 my-4"></Box>
        
        <Box className="flex justify-between items-center pt-4 px-2">
                     <Text className="text-gray-800 font-semibold" style={{ fontSize: '20px' }}>
             Tổng tiền:
           </Text>
                     <Text className="font-bold" style={{ color: '#04A1B3', fontSize: '16px' }}>
             {totalConfirmedAmount.toLocaleString('vi-VN')} VNĐ
           </Text>
        </Box>
      </Box>

      {/* Supplier Notes */}
      <Box className="bg-white rounded-lg p-4 mb-4 mx-4 shadow-sm">
        <Text className="text-gray-900 font-semibold mb-4" style={{ fontSize: '16px' }}>
          Ghi chú NCC
        </Text>
                 {order.crdfd_status === 'pending' ? (
                       <Input
              placeholder="Nhập ghi chú về đơn hàng (nếu có)..."
              value={supplierNotes}
              onChange={(e) => setSupplierNotes(e.target.value)}
              size="medium"
            />
         ) : (
           <Box className="p-3 bg-gray-50 rounded-lg border border-gray-200">
             <Text style={{ fontSize: '14px', color: '#6b7280' }}>
               {supplierNotes || "Không có ghi chú"}
             </Text>
           </Box>
         )}
      </Box>

             {/* Action Buttons */}
       {order.crdfd_status === 'pending' && (
        <Box className="space-y-3 mx-4 mb-4">
          {!showRejectForm ? (
            <>
              <Button
                variant="primary"
                size="large"
                fullWidth
                onClick={handleConfirm}
                style={{
            backgroundColor: '#04A1B3',
            borderColor: '#04A1B3'
          }}
              >
                Xác nhận
              </Button>
              
              <Button
                variant="secondary"
                size="large"
                fullWidth
                onClick={() => setShowRejectForm(true)}
                className="border-red-500 text-red-500 hover:bg-red-50"
              >
                Từ chối
              </Button>
            </>
          ) : (
            <Box className="bg-white rounded-lg p-4 shadow-sm">
              <Text.Title size="normal" className="text-gray-900 mb-3">
                Lý do từ chối
              </Text.Title>
              <Input
                placeholder="Nhập lý do từ chối đơn hàng..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mb-3"
              />
              <Box className="flex space-x-3">
                <Button
                  variant="secondary"
                  size="medium"
                  fullWidth
                  onClick={handleReject}
                  disabled={!rejectReason.trim()}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  Xác nhận từ chối
                </Button>
                <Button
                  variant="secondary"
                  size="medium"
                  fullWidth
                  onClick={() => setShowRejectForm(false)}
                >
                  Hủy
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default OrderDetail; 