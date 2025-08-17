import { Box, Text, Button } from "zmp-ui";

interface OrderCardProps {
  order: {
    crdfd_orderid: string;
    crdfd_ordernumber: string;
    crdfd_customername: string;
    crdfd_orderdate: string;
    crdfd_requesteddeliverydate: string;
    crdfd_status: 'pending' | 'confirmed' | 'rejected';
    crdfd_totalamount: number;
    items?: any[];
  };
  onViewDetails: (orderId: string) => void;
}

const OrderCard = ({ order, onViewDetails }: OrderCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chờ xác nhận';
      case 'confirmed':
        return 'Đã xác nhận';
      case 'rejected':
        return 'Từ chối';
      default:
        return 'Không xác định';
    }
  };

  return (
    <Box className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3 order-card" style={{ borderLeft: '4px solid #04A1B3' }}>
      <Box className="flex justify-between items-start mb-3">
        <Box>
          <Text.Title size="normal" className="text-gray-900 mb-1">
            Đơn hàng #{order.crdfd_ordernumber}
          </Text.Title>
          <Text size="small" className="text-gray-600">
            Nhân viên mua hàng: {order.crdfd_customername}
          </Text>
        </Box>
        <Box className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.crdfd_status)}`}>
          {getStatusText(order.crdfd_status)}
        </Box>
      </Box>
      
      <Box className="space-y-2 mb-4">
                  <Box className="flex justify-between">
            <Text size="small" className="text-gray-600">Ngày đặt hàng:</Text>
            <Text size="small" className="text-gray-900">{order.crdfd_orderdate}</Text>
          </Box>
        <Box className="flex justify-between">
          <Text size="small" className="text-gray-600">Số lượng SP:</Text>
          <Text size="small" className="text-gray-900">{order.items?.length || 0}</Text>
        </Box>
        <Box className="flex justify-between">
          <Text size="small" className="text-gray-600">Tổng tiền:</Text>
          <Text size="small" className="text-gray-900 font-medium">
            {order.crdfd_totalamount.toLocaleString('vi-VN')} VNĐ
          </Text>
        </Box>
      </Box>
      
      <Button
        variant="primary"
        size="small"
        fullWidth
        onClick={() => onViewDetails(order.crdfd_orderid)}
                  style={{
            backgroundColor: '#04A1B3',
            borderColor: '#04A1B3'
          }}
      >
        Xem chi tiết
      </Button>
    </Box>
  );
};

export default OrderCard; 