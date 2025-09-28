import Image from "next/image";
import styles from "./page.module.css";
import HomeWrapper from "./Components/Containers/HomeWrapper";
export default function Home() {
  return (
    <div className={styles.page}>
      <HomeWrapper />
    </div>
  );
}
