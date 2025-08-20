import { useState, useEffect } from "react";
import { Box } from "zmp-ui";
import DraftOrderDetail from "@/components/draft-order-detail";
import BottomNavigation from "@/components/bottom-navigation";
import Profile from "@/components/profile";
import HomeDashboard from "@/components/home-dashboard";
import OrdersPage from "@/components/orders-page";
import Login from "@/components/Login";
import { apiService, Supplier, DraftOrder } from "../services/api";

function HomePage() {
  const [selectedOrder, setSelectedOrder] = useState<DraftOrder | null>(null);
  const [currentView, setCurrentView] = useState("home");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<Supplier | null>(null);
  const [orders, setOrders] = useState<DraftOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [draftOrders, setDraftOrders] = useState<DraftOrder[]>([]);
  const [allDraftOrders, setAllDraftOrders] = useState<DraftOrder[]>([]);

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

      const draftsRes = await wrap(apiService.getDraftOrders(userInfo.cr44a_manhacungcap));
      const allDraftsRes = await wrap(apiService.getAllDraftOrders(userInfo.cr44a_manhacungcap));

      if (draftsRes.ok) {
        setDraftOrders(draftsRes.value);
        // Sử dụng draft orders thay vì orders cũ
        setOrders(draftsRes.value);
      } else {
        console.warn('getDraftOrders failed:', draftsRes.reason);
        setDraftOrders([]);
        setOrders([]);
      }

      if (allDraftsRes.ok) {
        setAllDraftOrders(allDraftsRes.value);
      } else {
        console.warn('getAllDraftOrders failed:', allDraftsRes.reason);
        setAllDraftOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  

  const handleConfirmOrder = async (orderIds: string[], updatedItems: { id: string; quantity: number; deliveryDate: string }[], notes: string) => {
    try {
      for (const orderId of orderIds) {
        const order = orders.find(o => o.crdfd_kehoachhangve_draftid === orderId);
        if (order) {
          const updatedItem = updatedItems.find(item => item.id === orderId);
          await apiService.updateDraftOrderStatus(
            orderId, 
            191920001, // Đã xác nhận
            updatedItem?.quantity || order.crdfd_soluong,
            order.crdfd_soluong,
            notes,
            updatedItem?.deliveryDate
          );
        }
      }
      alert("Đã xác nhận đơn hàng thành công!");
      setSelectedOrder(null);
      fetchOrders(); // Refresh orders list
    } catch (error) {
      console.error('Error confirming order:', error);
      alert('Có lỗi xảy ra khi xác nhận đơn hàng');
    }
  };

  const handleRejectOrder = async (orderIds: string[]) => {
    try {
      for (const orderId of orderIds) {
        const order = orders.find(o => o.crdfd_kehoachhangve_draftid === orderId);
        if (order) {
          await apiService.updateDraftOrderStatus(
            orderId, 
            191920002, // Từ chối nhận đơn
            0, // Số lượng xác nhận = 0
            order.crdfd_soluong
          );
        }
      }
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
        <DraftOrderDetail
          orders={[selectedOrder]}
          onBack={handleBack}
          onConfirm={handleConfirmOrder}
          onReject={handleRejectOrder}
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
    // Tính số đơn hàng chưa xác nhận từ allDraftOrders
    const pendingOrders = allDraftOrders.filter(order => 
      order.crdfd_ncc_nhan_don === 191920000 || 
      order.crdfd_ncc_nhan_don === null || 
      order.crdfd_ncc_nhan_don === undefined
    );
    
    // Nhóm các đơn hàng chưa xác nhận theo nhân viên + ngày
    const groupedPendingOrders: Record<string, DraftOrder[]> = {};
    pendingOrders.forEach(item => {
      const date = new Date(item.createdon).toLocaleDateString('vi-VN');
      const key = `${item.crdfd_nhanvienmuahang} - ${date}`;
      if (!groupedPendingOrders[key]) groupedPendingOrders[key] = [];
      groupedPendingOrders[key].push(item);
    });
    
    const urgentCount = Object.keys(groupedPendingOrders).length;
    
    // Tính số đơn hàng theo trạng thái
    const statusCounts = allDraftOrders.reduce((acc, order) => {
      const status = order.crdfd_ncc_nhan_don;
      if (status === 191920000 || status === null || status === undefined) {
        acc.pending++;
      } else if (status === 191920001) {
        acc.confirmed++;
      } else if (status === 191920002) {
        acc.rejected++;
      }
      return acc;
    }, { pending: 0, confirmed: 0, rejected: 0 });
    return (
      <Box>
        <HomeDashboard 
          onViewAllOrders={() => setCurrentView('orders')}
          supplierName={userInfo?.crdfd_suppliername}
          urgentCount={urgentCount}
          allDraftOrders={allDraftOrders}
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
        allDraftOrders={allDraftOrders}
      />
      <BottomNavigation activeTab={currentView} onTabChange={handleTabChange} />
    </Box>
  );
}

export default HomePage;
