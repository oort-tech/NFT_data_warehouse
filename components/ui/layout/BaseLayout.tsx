import { FunctionComponent } from "react";
import Navbar from "../navbar";
import SideMenu from "../SideMenu";
import { Space } from "antd";
// import MarketRoutes from "@ui/MarketRoutes";

const BaseLayout: FunctionComponent = ({children}) => {
  return (
    <>
      <div className="App">
        <Navbar />
        <Space className="MenuContent">
          <SideMenu />
          <div className="PageContent">
            {children}
          </div>
        </Space>
      </div>
    </>
  )
}

export default BaseLayout;
