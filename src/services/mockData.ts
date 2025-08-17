import { Supplier, Order, OrderItem } from './api';

// Mock data cho testing
export const mockSupplier: Supplier = {
  crdfd_supplierid: "supplier-001",
  cr44a_manhacungcap: "NCC001", // Mã NCC mới
  crdfd_suppliername: "Công ty TNHH ABC",
  crdfd_misaname: "ABC Company Ltd",
  crdfd_supplierphone: "0123456789",
  crdfd_password: "123456"
};

export const mockOrders: Order[] = [
  {
    crdfd_orderid: "order-001",
    crdfd_ordernumber: "DH001",
    crdfd_customername: "Nguyễn Văn A",
    crdfd_customerphone: "0987654321",
    crdfd_customeraddress: "123 Đường ABC, Quận 1, TP.HCM",
    crdfd_orderdate: "15/12/2024",
    crdfd_requesteddeliverydate: "20/12/2024",
    crdfd_status: "pending",
    crdfd_totalamount: 15000000,
    crdfd_suppliernotes: "",
    items: [
      {
        crdfd_orderitemid: "item-001",
        crdfd_productname: "Sản phẩm A",
        crdfd_requestedquantity: 100,
        crdfd_confirmedquantity: 100,
        crdfd_unitprice: 50000,
        crdfd_unit: "cái",
        crdfd_notes: "",
        crdfd_deliverydate: "22/12/2024"
      },
      {
        crdfd_orderitemid: "item-002",
        crdfd_productname: "Sản phẩm B",
        crdfd_requestedquantity: 50,
        crdfd_confirmedquantity: 50,
        crdfd_unitprice: 200000,
        crdfd_unit: "kg",
        crdfd_notes: "",
        crdfd_deliverydate: "23/12/2024"
      }
    ]
  },
  {
    crdfd_orderid: "order-002",
    crdfd_ordernumber: "DH002",
    crdfd_customername: "Trần Thị B",
    crdfd_customerphone: "0987654322",
    crdfd_customeraddress: "456 Đường XYZ, Quận 2, TP.HCM",
    crdfd_orderdate: "14/12/2024",
    crdfd_requesteddeliverydate: "18/12/2024",
    crdfd_status: "confirmed",
    crdfd_totalamount: 8000000,
    crdfd_suppliernotes: "Đã xác nhận giao hàng đúng hạn",
    items: [
      {
        crdfd_orderitemid: "item-003",
        crdfd_productname: "Sản phẩm C",
        crdfd_requestedquantity: 80,
        crdfd_confirmedquantity: 80,
        crdfd_unitprice: 100000,
        crdfd_unit: "lít",
        crdfd_notes: "",
        crdfd_deliverydate: "19/12/2024"
      }
    ]
  },
  {
    crdfd_orderid: "order-003",
    crdfd_ordernumber: "DH003",
    crdfd_customername: "Lê Văn C",
    crdfd_customerphone: "0987654323",
    crdfd_customeraddress: "789 Đường DEF, Quận 3, TP.HCM",
    crdfd_orderdate: "13/12/2024",
    crdfd_requesteddeliverydate: "17/12/2024",
    crdfd_status: "rejected",
    crdfd_totalamount: 12000000,
    crdfd_suppliernotes: "Không đủ hàng trong kho",
    items: [
      {
        crdfd_orderitemid: "item-004",
        crdfd_productname: "Sản phẩm D",
        crdfd_requestedquantity: 120,
        crdfd_confirmedquantity: 0,
        crdfd_unitprice: 100000,
        crdfd_unit: "m²",
        crdfd_notes: "",
        crdfd_deliverydate: "18/12/2024"
      }
    ]
  }
];

// Mock API service cho testing
export class MockApiService {
  async authenticateSupplier(phone: string, password: string): Promise<Supplier> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (phone === mockSupplier.crdfd_supplierphone && password === mockSupplier.crdfd_password) {
      return mockSupplier;
    } else {
      throw new Error('Số điện thoại hoặc mật khẩu không chính xác');
    }
  }

  async getSupplierProfile(supplierId: string): Promise<Supplier> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockSupplier;
  }

  async getSupplierOrders(supplierCode: string): Promise<Order[]> {
    await new Promise(resolve => setTimeout(resolve, 800));
    // Sử dụng supplierCode thay vì supplierId
    return mockOrders;
  }

  async getOrderDetails(orderId: string): Promise<Order> {
    await new Promise(resolve => setTimeout(resolve, 600));
    const order = mockOrders.find(o => o.crdfd_orderid === orderId);
    if (!order) {
      throw new Error('Không tìm thấy đơn hàng');
    }
    return order;
  }

  async updateOrder(orderId: string, confirmedItems: OrderItem[], notes: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
  }

  async rejectOrder(orderId: string, reason: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
  }

  async changePassword(supplierId: string, newPassword: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
  }
}

export const mockApiService = new MockApiService();
