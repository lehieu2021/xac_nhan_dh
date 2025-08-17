// API Configuration and Services for Dynamics 365 CRM
const API_BASE_URL = 'https://wecare-ii.crm5.dynamics.com/api/data/v9.2';
const ACCESS_TOKEN_URL = 'https://prod-51.southeastasia.logic.azure.com:443/workflows/1db8c4d15497441287f7c888e8888ed4/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=8smnu3fDoDarEJ1vXEJV5YTDTjhQMKNHrM_AGw3uqXs';

// Types for API responses
export interface Supplier {
  crdfd_supplierid: string;
  cr44a_manhacungcap: string; // Mã NCC thay vì ID
  crdfd_suppliername: string;
  crdfd_misaname: string;
  crdfd_supplierphone: string;
  crdfd_supplier_addr?: string;
  crdfd_password: string;
}

export interface Order {
  crdfd_orderid: string;
  crdfd_ordernumber: string;
  crdfd_customername: string;
  crdfd_customerphone: string;
  crdfd_customeraddress: string;
  crdfd_orderdate: string;
  crdfd_requesteddeliverydate: string;
  crdfd_status: 'pending' | 'confirmed' | 'rejected';
  crdfd_totalamount: number;
  crdfd_suppliernotes: string;
  items?: OrderItem[];
}

export interface OrderItem {
  crdfd_orderitemid: string;
  crdfd_productname: string;
  crdfd_requestedquantity: number;
  crdfd_confirmedquantity: number;
  crdfd_unitprice: number;
  crdfd_unit: string;
  crdfd_notes: string;
  crdfd_deliverydate: string;
}

// Interface cho đơn hàng từ crdfd_kehoachhangve_drafts
export interface DraftOrder {
  crdfd_kehoachhangve_draftid: string;
  cr1bb_tensanpham: string; // Tên sản phẩm
  cr1bb_onvical: string; // Đơn vị tính
  crdfd_soluong: number; // Số lượng
  crdfd_gia: number; // Giá
  cr1bb_ngaygiaodukien: string; // Ngày giao dự kiến
  crdfd_mancc: string; // Mã NCC
  crdfd_nhanvienmuahang: string; // Nhân viên mua hàng
  createdon: string; // Ngày tạo đơn hàng
  crdfd_urgent_type?: number | null; // Loại khẩn cấp (nếu có)
  cr1bb_image_url?: string; // Ảnh sản phẩm (nếu có)
}

// API Service Class
class ApiService {
  private accessToken: string | null = null;

  // Get access token from Azure Logic App
  async getAccessToken(): Promise<string> {
    try {
      const response = await fetch(ACCESS_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get access token: ${response.status}`);
      }

      // Kiểm tra content type để xác định response format
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        // Response là JSON
        const data = await response.json();
        this.accessToken = data.access_token || data.token;
      } else {
        // Response có thể là JWT token trực tiếp
        const tokenText = await response.text();
        
        // Kiểm tra xem có phải JWT token không (bắt đầu bằng "eyJ")
        if (tokenText.startsWith('eyJ')) {
          this.accessToken = tokenText.trim();
        } else {
          // Thử parse JSON nếu không phải JWT
          try {
            const data = JSON.parse(tokenText);
            this.accessToken = data.access_token || data.token;
          } catch (parseError) {
            throw new Error('Invalid response format from access token endpoint');
          }
        }
      }
      
      if (!this.accessToken) {
        throw new Error('Access token not found in response');
      }

      return this.accessToken;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  // Authenticate supplier by phone and password
  async authenticateSupplier(phone: string, password: string): Promise<Supplier> {
    try {
      const token = await this.getAccessToken();
      
      // Query supplier by phone number - thêm cr44a_manhacungcap
      const query = `$select=crdfd_supplierid,cr44a_manhacungcap,crdfd_suppliername,crdfd_misaname,crdfd_supplierphone,crdfd_supplier_addr,crdfd_password&$filter=crdfd_supplierphone eq '${phone}'`;
      const url = `${API_BASE_URL}/crdfd_suppliers?${query}`;
      
      
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'OData-MaxVersion': '4.0',
          'OData-Version': '4.0',
        },
      });

      

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Authentication response error:', errorText);
        throw new Error(`Lỗi kết nối: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      
      if (!data.value || data.value.length === 0) {
        throw new Error('Không tìm thấy nhà cung cấp với số điện thoại này');
      }

      const supplier = data.value[0];
      
      
      // Xử lý trường hợp password null
      if (supplier.crdfd_password === null || supplier.crdfd_password === undefined || supplier.crdfd_password === '') {
        // Nếu password null, cho phép user nhập "Wecare" làm password mặc định
        if (password === 'Wecare') {
          
          // Cập nhật password mặc định vào database
          await this.updateDefaultPassword(supplier.crdfd_supplierid, 'Wecare');
          supplier.crdfd_password = 'Wecare';
          return supplier;
        } else {
          throw new Error('Tài khoản mới cần sử dụng mật khẩu mặc định "Wecare"');
        }
      }
      
      // Verify password từ cột crdfd_password trong database
      if (supplier.crdfd_password !== password) {
        throw new Error('Mật khẩu không chính xác');
      }

      
      return supplier;
    } catch (error) {
      console.error('Authentication error:', error);
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Có lỗi xảy ra trong quá trình xác thực');
      }
    }
  }

  // Get supplier profile information
  async getSupplierProfile(supplierId: string): Promise<Supplier> {
    try {
      const token = await this.getAccessToken();
      
      const url = `${API_BASE_URL}/crdfd_suppliers(${supplierId})?$select=crdfd_supplierid,cr44a_manhacungcap,crdfd_suppliername,crdfd_misaname,crdfd_supplierphone,crdfd_supplier_addr,crdfd_password`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'OData-MaxVersion': '4.0',
          'OData-Version': '4.0',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get supplier profile: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting supplier profile:', error);
      throw error;
    }
  }

  // Get orders for a supplier
  async getSupplierOrders(supplierCode: string): Promise<Order[]> {
    try {
      const token = await this.getAccessToken();
      
      // Sử dụng cr44a_manhacungcap thay vì crdfd_supplierid
      const query = `$select=crdfd_orderid,crdfd_ordernumber,crdfd_customername,crdfd_customerphone,crdfd_customeraddress,crdfd_orderdate,crdfd_requesteddeliverydate,crdfd_status,crdfd_totalamount,crdfd_suppliernotes&$filter=cr44a_manhacungcap eq '${supplierCode}'&$orderby=crdfd_orderdate desc`;
      const url = `${API_BASE_URL}/crdfd_orders?${query}`;
      
      
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'OData-MaxVersion': '4.0',
          'OData-Version': '4.0',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get orders: ${response.status}`);
      }

      const data = await response.json();
      
      return data.value || [];
    } catch (error) {
      console.error('Error getting orders:', error);
      throw error;
    }
  }

  // Get order details including items
  async getOrderDetails(orderId: string): Promise<Order> {
    try {
      const token = await this.getAccessToken();
      
      // Get order header
      const orderUrl = `${API_BASE_URL}/crdfd_orders(${orderId})?$select=crdfd_orderid,crdfd_ordernumber,crdfd_customername,crdfd_customerphone,crdfd_customeraddress,crdfd_orderdate,crdfd_requesteddeliverydate,crdfd_status,crdfd_totalamount,crdfd_suppliernotes`;
      
      const orderResponse = await fetch(orderUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'OData-MaxVersion': '4.0',
          'OData-Version': '4.0',
        },
      });

      if (!orderResponse.ok) {
        throw new Error(`Failed to get order: ${orderResponse.status}`);
      }

      const order = await orderResponse.json();

      // Get order items
      const itemsQuery = `$select=crdfd_orderitemid,crdfd_productname,crdfd_requestedquantity,crdfd_confirmedquantity,crdfd_unitprice,crdfd_unit,crdfd_notes,crdfd_deliverydate&$filter=_crdfd_order_value eq ${orderId}`;
      const itemsUrl = `${API_BASE_URL}/crdfd_orderitems?${itemsQuery}`;
      
      const itemsResponse = await fetch(itemsUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'OData-MaxVersion': '4.0',
          'OData-Version': '4.0',
        },
      });

      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json();
        order.items = itemsData.value || [];
      }

      return order;
    } catch (error) {
      console.error('Error getting order details:', error);
      throw error;
    }
  }

  // Update order status and items
  async updateOrder(orderId: string, confirmedItems: OrderItem[], notes: string): Promise<void> {
    try {
      const token = await this.getAccessToken();
      
      // Update order notes
      const orderUpdateUrl = `${API_BASE_URL}/crdfd_orders(${orderId})`;
      await fetch(orderUpdateUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'OData-MaxVersion': '4.0',
          'OData-Version': '4.0',
        },
        body: JSON.stringify({
          crdfd_suppliernotes: notes,
          crdfd_status: 'confirmed'
        }),
      });

      // Update order items
      for (const item of confirmedItems) {
        const itemUpdateUrl = `${API_BASE_URL}/crdfd_orderitems(${item.crdfd_orderitemid})`;
        await fetch(itemUpdateUrl, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'OData-MaxVersion': '4.0',
            'OData-Version': '4.0',
          },
          body: JSON.stringify({
            crdfd_confirmedquantity: item.crdfd_confirmedquantity,
            crdfd_deliverydate: item.crdfd_deliverydate
          }),
        });
      }
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  }

  // Reject order
  async rejectOrder(orderId: string, reason: string): Promise<void> {
    try {
      const token = await this.getAccessToken();
      
      const url = `${API_BASE_URL}/crdfd_orders(${orderId})`;
      await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'OData-MaxVersion': '4.0',
          'OData-Version': '4.0',
        },
        body: JSON.stringify({
          crdfd_suppliernotes: reason,
          crdfd_status: 'rejected'
        }),
      });
    } catch (error) {
      console.error('Error rejecting order:', error);
      throw error;
    }
  }

  // Change password
  async changePassword(supplierId: string, newPassword: string): Promise<void> {
    try {
      const token = await this.getAccessToken();
      
      const url = `${API_BASE_URL}/crdfd_suppliers(${supplierId})`;
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'OData-MaxVersion': '4.0',
          'OData-Version': '4.0',
        },
        body: JSON.stringify({
          crdfd_password: newPassword
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Password change response error:', errorText);
        throw new Error(`Không thể đổi mật khẩu: ${response.status} - ${errorText}`);
      }

      
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  // Update default password for a supplier
  private async updateDefaultPassword(supplierId: string, newPassword: string): Promise<void> {
    try {
      const token = await this.getAccessToken();
      const url = `${API_BASE_URL}/crdfd_suppliers(${supplierId})`;
      await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'OData-MaxVersion': '4.0',
          'OData-Version': '4.0',
        },
        body: JSON.stringify({
          crdfd_password: newPassword
        }),
      });
      
    } catch (error) {
      console.error(`Error updating default password for supplier ${supplierId}:`, error);
      throw error;
    }
  }

  // Get draft orders for a supplier from crdfd_kehoachhangve_drafts
  async getDraftOrders(supplierCode: string): Promise<DraftOrder[]> {
    try {
      const token = await this.getAccessToken();
      
      // Query với filter theo mã NCC và trạng thái
      const query = `$select=crdfd_kehoachhangve_draftid,cr1bb_tensanpham,cr1bb_onvical,crdfd_soluong,crdfd_gia,cr1bb_ngaygiaodukien,crdfd_mancc,crdfd_nhanvienmuahang,createdon,crdfd_urgent_type&$top=50&$filter=statecode eq 0 and crdfd_trang_thai eq 191920000 and crdfd_mancc eq '${supplierCode}'&$orderby=createdon desc`;
      const url = `${API_BASE_URL}/crdfd_kehoachhangve_drafts?${query}`;
      
      
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'OData-MaxVersion': '4.0',
          'OData-Version': '4.0',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Draft orders response error:', errorText);
        throw new Error(`Failed to get draft orders: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      return data.value || [];
    } catch (error) {
      console.error('Error getting draft orders:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();