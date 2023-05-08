
import { Menu } from "antd";
import { AppstoreOutlined } from "@ant-design/icons";
import Link from 'next/link';

function SideMenu() {
  return (
    <div className="SideMenu">
      <Menu
        className="AntdMenu"
        mode="inline"
      >
        <Menu.Item key="1" icon={<AppstoreOutlined />}>
          <Link href="/">
            <a>Dashboard</a>
          </Link>
        </Menu.Item>
        <Menu.Item key="2" icon={<AppstoreOutlined />}>
          <Link href="/nft">
            <a>CreateNFT</a>
          </Link>
        </Menu.Item>
        <Menu.Item key="3" icon={<AppstoreOutlined />}>
          <Link href="/profile">
            <a>Profile</a>
          </Link>
        </Menu.Item>
      </Menu>
    </div>
  );
}

export default SideMenu;
