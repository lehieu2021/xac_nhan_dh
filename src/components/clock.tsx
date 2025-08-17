import { useEffect, useState } from "react";
import { Text } from "zmp-ui";

function Clock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const formattedTime = now.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      setTime(formattedTime);
    };

    updateClock();
    const intervalId = setInterval(updateClock, 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <Text className="font-mono text-white text-lg font-semibold tracking-wide">
      {time}
    </Text>
  );
}

export default Clock;
