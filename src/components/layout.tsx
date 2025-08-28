import { getSystemInfo } from "zmp-sdk";
import {
  AnimationRoutes,
  App,
  Route,
  ZMPRouter,
} from "zmp-ui";
import { AppProps } from "zmp-ui/app";

import HomePage from "@/pages/index";

const Layout = () => {
  return (
    <App theme={getSystemInfo().zaloTheme as AppProps["theme"]}>
      <ZMPRouter>
        <AnimationRoutes>
          <Route path="/" element={<HomePage />}></Route>
        </AnimationRoutes>
      </ZMPRouter>
    </App>
  );
};
export default Layout;
