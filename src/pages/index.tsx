import { useState, useEffect } from "react";
import { Box, Text, Page, Button, Icon, Input } from "zmp-ui";
import OrderCard from "@/components/order-card";
import OrderDetail from "@/components/order-detail";
import Header from "@/components/header";
import BottomNavigation from "@/components/bottom-navigation";
import Profile from "@/components/profile";
import HomeDashboard from "@/components/home-dashboard";
import OrdersPage from "@/components/orders-page";
import Login from "@/components/Login";
import { apiService, Order, Supplier, DraftOrder } from "../services/api";

function HomePage() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [currentView, setCurrentView] = useState("home");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<Supplier | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [draftOrders, setDraftOrders] = useState<DraftOrder[]>([]);

  // Fetch orders when user is logged in
  useEffect(() => {
    if (isLoggedIn && userInfo) {
      fetchOrders();
    }
  }, [isLoggedIn, userInfo]);

  const fetchOrders = async () => {
    if (!userInfo) return;
    
    setIsLoading(true);
    try {
      // Polyfill kiểu allSettled để tương thích ES6
      const wrap = <T,>(p: Promise<T>) => p.then(
        (value) => ({ ok: true as const, value }),
        (reason) => ({ ok: false as const, reason })
      );

      const [ordersRes, draftsRes] = await Promise.all([
        wrap(apiService.getSupplierOrders(userInfo.cr44a_manhacungcap)),
        wrap(apiService.getDraftOrders(userInfo.cr44a_manhacungcap)),
      ]);

      if (ordersRes.ok) {
        setOrders(ordersRes.value);
      } else {
        console.warn('getSupplierOrders failed:', ordersRes.reason);
        setOrders([]);
      }

      if (draftsRes.ok) {
        setDraftOrders(draftsRes.value);
      } else {
        console.warn('getDraftOrders failed:', draftsRes.reason);
        setDraftOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.crdfd_ordernumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.crdfd_customername.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "pending") return order.crdfd_status === 'pending' && matchesSearch;
    if (activeTab === "confirmed") return order.crdfd_status === 'confirmed' && matchesSearch;
    if (activeTab === "rejected") return order.crdfd_status === 'rejected' && matchesSearch;
    
    return matchesSearch;
  });

  const handleViewDetails = async (orderId: string) => {
    try {
      const orderDetails = await apiService.getOrderDetails(orderId);
      setSelectedOrder(orderDetails);
    } catch (error) {
      console.error('Error fetching order details:', error);
      alert('Không thể tải chi tiết đơn hàng');
    }
  };

  const handleConfirmOrder = async (orderId: string, confirmedItems: any[], notes: string) => {
    try {
      await apiService.updateOrder(orderId, confirmedItems, notes);
      alert("Đã xác nhận đơn hàng thành công!");
      setSelectedOrder(null);
      fetchOrders(); // Refresh orders list
    } catch (error) {
      console.error('Error confirming order:', error);
      alert('Có lỗi xảy ra khi xác nhận đơn hàng');
    }
  };

  const handleRejectOrder = async (orderId: string, reason: string) => {
    try {
      await apiService.rejectOrder(orderId, reason);
      alert("Đã từ chối đơn hàng!");
      setSelectedOrder(null);
      fetchOrders(); // Refresh orders list
    } catch (error) {
      console.error('Error rejecting order:', error);
      alert('Có lỗi xảy ra khi từ chối đơn hàng');
    }
  };

  const handleBack = () => {
    setSelectedOrder(null);
  };

  const handleTabChange = (tab: string) => {
    setCurrentView(tab);
    setSelectedOrder(null); // Reset selected order when changing tabs
  };

  const handleLogin = async (supplierId: string, supplierData: Supplier) => {
    setIsLoggedIn(true);
    setUserInfo(supplierData);
    setCurrentView("home");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserInfo(null);
    setCurrentView("home");
    setSelectedOrder(null);
    setOrders([]);
  };

  const handlePasswordChange = async (newPassword: string) => {
    if (!userInfo) return;
    
    try {
      // Vẫn sử dụng crdfd_supplierid để update password
      await apiService.changePassword(userInfo.crdfd_supplierid, newPassword);
      alert("Mật khẩu đã được đổi thành công!");
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Có lỗi xảy ra khi đổi mật khẩu');
    }
  };

  const handleLoginError = (message: string) => {
    alert(message);
  };

  // Show login screen if not logged in
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} onError={handleLoginError} />;
  }

  if (selectedOrder) {
    return (
      <Box>
        <OrderDetail
          order={selectedOrder}
          onConfirm={handleConfirmOrder}
          onReject={handleRejectOrder}
          onBack={handleBack}
        />
        <BottomNavigation activeTab={currentView} onTabChange={handleTabChange} />
      </Box>
    );
  }

  // Profile View (Hồ sơ)
  if (currentView === 'profile') {
    return (
      <Box>
        <Profile 
          onBack={() => setCurrentView('home')} 
          onLogout={handleLogout}
          onPasswordChange={handlePasswordChange}
          supplierId={userInfo?.crdfd_supplierid || ""}
          orders={orders}
          draftOrders={draftOrders}
        />
        <BottomNavigation activeTab={currentView} onTabChange={handleTabChange} />
      </Box>
    );
  }

  // Home View - Dashboard
  if (currentView === 'home') {
    // Tính số đơn gấp từ draftOrders: nhóm theo người mua hàng + ngày tạo; nhóm nào có item có crdfd_urgent_type thì tính là 1
    const groupedDrafts: Record<string, DraftOrder[]> = {};
    draftOrders.forEach(item => {
      const date = new Date(item.createdon).toLocaleDateString('vi-VN');
      const key = `${item.crdfd_nhanvienmuahang} - ${date}`;
      if (!groupedDrafts[key]) groupedDrafts[key] = [];
      groupedDrafts[key].push(item);
    });
    const urgentCount = Object.values(groupedDrafts).filter(group => group.some(i => i.crdfd_urgent_type !== null && i.crdfd_urgent_type !== undefined)).length;
    return (
      <Box>
        <HomeDashboard 
          onViewAllOrders={() => setCurrentView('orders')}
          supplierName={userInfo?.crdfd_suppliername}
          urgentCount={urgentCount}
        />
        <BottomNavigation activeTab={currentView} onTabChange={handleTabChange} />
      </Box>
    );
  }



  // Orders View - Sử dụng component OrdersPage mới
  return (
    <Box>
      <OrdersPage 
        supplierCode={userInfo?.cr44a_manhacungcap || ""}
        onBack={() => setCurrentView('home')}
      />
      <BottomNavigation activeTab={currentView} onTabChange={handleTabChange} />
    </Box>
  );
}

export default HomePage;
