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
    <Box className="text-white shadow-sm relative" style={{ backgroundColor: '#04A1B3' }}>
      <Box className="pt-12 pb-4 px-4 relative">
        {/* Back Button */}
        {(showBackButton || leftAction) && (
          <Box className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
            {showBackButton && onBack ? (
              <Button
                onClick={onBack}
                className="rounded-full p-2 transition-all duration-200 hover:bg-white/10"
                style={{ 
                  minWidth: '40px', 
                  height: '40px',
                  backgroundColor: 'transparent',
                  borderColor: 'transparent'
                }}
              >
                <Icon icon="zi-arrow-left" style={{ color: '#FFFFFF' }} size={18} />
              </Button>
            ) : leftAction ? (
              <Button
                onClick={leftAction.onClick}
                className="rounded-full p-2 transition-all duration-200 hover:bg-white/10"
                style={{
                  minWidth: '40px',
                  height: '40px',
                  backgroundColor: 'transparent',
                  borderColor: 'transparent'
                }}
              >
                <Icon icon={leftAction.icon} style={{ color: '#FFFFFF' }} size={18} />
              </Button>
            ) : null}
          </Box>
        )}

        {/* Right Action */}
        {rightAction && (
          <Box className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10">
            <Button
              onClick={rightAction.onClick}
              className="rounded-full p-2 transition-all duration-200 hover:bg-white/10"
              style={{
                minWidth: '40px',
                height: '40px',
                backgroundColor: 'transparent',
                borderColor: 'transparent'
              }}
            >
              <Icon icon={rightAction.icon as any} style={{ color: '#FFFFFF' }} size={18} />
            </Button>
          </Box>
        )}

        {/* Title Section */}
        <Box className="flex items-center justify-center w-full">
          <Box className="text-center flex-1">
            <Text className="text-white mb-1 font-semibold" style={{ fontSize: '18px', lineHeight: '1.3' }}>
              {title}
            </Text>
            {subtitle && (
              <Text className="text-white/90 font-normal" style={{ fontSize: '13px', lineHeight: '1.4' }}>
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