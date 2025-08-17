import { Box, Text, Button } from "zmp-ui";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const BottomNavigation = ({ activeTab, onTabChange }: BottomNavigationProps) => {
  const getIcon = (iconType: string, isActive: boolean) => {
    const color = isActive ? '#04A1B3' : '#9CA3AF';
    
    switch (iconType) {
      case 'home':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9,22 9,12 15,12 15,22"/>
          </svg>
        );
      case 'orders':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10,9 9,9 8,9"/>
          </svg>
        );
      case 'profile':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const tabs = [
    {
      id: 'home',
      label: 'Trang chủ',
      icon: 'home'
    },
    {
      id: 'orders',
      label: 'Đơn hàng',
      icon: 'orders'
    },
    {
      id: 'profile',
      label: 'Hồ sơ',
      icon: 'profile'
    }
  ];

  return (
    <Box 
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 pb-3 pt-1"
      style={{
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.08)',
        zIndex: 1000,
        backdropFilter: 'blur(20px)',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        height: '80px'
      }}
    >
      <Box className="flex justify-around items-center max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Button
              key={tab.id}
              variant="tertiary"
              size="medium"
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center justify-center min-w-0 flex-1 transition-all duration-200 hover:scale-105"
                             style={{
                 background: 'transparent',
                 border: 'none',
                 padding: '8px 6px',
                 height: 'auto',
                 borderRadius: '12px'
               }}
            >
                             <Box className="flex flex-col items-center space-y-1">
                 <Box 
                   className={`flex items-center justify-center p-1.5 rounded-full transition-all duration-200 ${
                     isActive ? 'bg-teal-50' : 'hover:bg-gray-50'
                   }`}
                   style={{ minHeight: '20px' }}
                 >
                   {getIcon(tab.icon, isActive)}
                 </Box>
                 <Text 
                   className={`text-sm font-medium transition-all duration-200 ${
                     isActive ? 'text-teal-600' : 'text-gray-500'
                   }`}
                   style={{ lineHeight: '1.2' }}
                 >
                   {tab.label}
                 </Text>
                {isActive && (
                  <Box 
                    className="w-1 h-1 bg-teal-600 rounded-full"
                    style={{ marginTop: '2px' }}
                  />
                )}
              </Box>
            </Button>
          );
        })}
      </Box>
    </Box>
  );
};

export default BottomNavigation;