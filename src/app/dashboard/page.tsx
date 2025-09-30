import { LateralNavbarType } from "../Types/LateralNavbarType";
import LateralNavbarComponent from "../Components/LateralNavbarComponent/LateralNavbarComponent";
import { HomeFilled } from "@fluentui/react-icons";
export default function Home() {
  const navItems: LateralNavbarType[] = [
    { title: "Home", link: "/", icon: <HomeFilled /> }, // Visible to all
    { title: "Profile", link: "/profile" }, // Visible to all
    { title: "Admin Panel", link: "/admin", isAdmin: true }, // Only admin and owner
    { title: "User Management", link: "/users", isAdmin: true }, // Only admin and owner
    { title: "System Settings", link: "/settings", isOwner: true }, // Only owner
  ];
  return (
    <>
      <LateralNavbarComponent
        items={navItems}
        userIsAdmin={true}
        userIsOwner={false}
      />
      <main></main>
    </>
  );
}
