import { Box, Text, Button, Icon } from "zmp-ui";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  leftAction?: {
    icon: "zi-arrow-left" | "zi-add-member-solid" | "zi-add-member" | "zi-add-photo" | "zi-add-story" | "zi-add-user-solid" | "zi-add-user" | "zi-admin" | "zi-arrow-down" | "zi-arrow-right";
    onClick: () => void;
  };
  rightAction?: {
    icon: string;
    onClick: () => void;
  };
}

const Header = ({ title, subtitle, showBackButton = false, onBack, leftAction, rightAction }: HeaderProps) => {
  return (
    <Box className="text-white shadow-lg relative custom-header" style={{ backgroundColor: '#04A1B3' }}>
      <Box className="pt-10 pb-4 px-6 relative">
        {/* Back Button */}
        {(showBackButton || leftAction) && (
          <Box className="absolute left-6 top-1/2 transform -translate-y-1/2 z-10">
            {showBackButton && onBack ? (
              <Button
                onClick={onBack}
                className="rounded-full p-3 transition-all duration-200 hover:scale-105 shadow-sm"
                style={{ 
                  minWidth: '48px', 
                  height: '48px',
                  backgroundColor: '#04A1B3',
                  borderColor: '#04A1B3'
                }}
              >
                <Icon icon="zi-arrow-left" style={{ color: '#FFFFFF' }} size={20} />
              </Button>
            ) : leftAction ? (
              <Button
                onClick={leftAction.onClick}
                className="rounded-full p-3 transition-all duration-200 hover:scale-105 shadow-sm"
                style={{
                  minWidth: '48px',
                  height: '48px',
                  backgroundColor: '#04A1B3',
                  borderColor: '#04A1B3'
                }}
              >
                <Icon icon={leftAction.icon} style={{ color: '#FFFFFF' }} size={20} />
              </Button>
            ) : null}
          </Box>
        )}

        {/* Title Section */}
        <Box className="flex items-center justify-center w-full">
          <Box className="text-center flex-1">
            <Text className="text-white mb-1 font-bold" style={{ fontSize: '20px', lineHeight: '1.3' }}>
              {title}
            </Text>
            {subtitle && (
              <Text className="text-white/90 font-medium" style={{ fontSize: '14px', lineHeight: '1.4' }}>
                {subtitle}
              </Text>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Header; 