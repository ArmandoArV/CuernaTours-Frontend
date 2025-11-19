import Image from "next/image";
import styles from "./page.module.css";
import HomeWrapper from "./Components/Containers/HomeWrapper/HomeWrapper";
import HomeAuthCheck from "./Components/HomeAuthCheck/HomeAuthCheck";

export default function Home() {
  return (
    <div className={styles.page}>
      <HomeAuthCheck />
      <HomeWrapper />
    </div>
  );
}
