import { useState, useEffect } from "react";
import { Box } from "zmp-ui";
import BottomNavigation from "@/components/bottom-navigation";
import Profile from "@/components/profile";
import HomeDashboard from "@/components/home-dashboard";
import OrdersPage from "@/components/orders-page";
import Login from "@/components/Login";
import { apiService, Supplier, DraftOrder } from "../services/api";

function HomePage() {
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

  



  const handleTabChange = (tab: string) => {
    setCurrentView(tab);
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
    
    // Đếm số đơn hàng chi tiết chưa xác nhận (không nhóm)
    const urgentCount = pendingOrders.length;
    
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
