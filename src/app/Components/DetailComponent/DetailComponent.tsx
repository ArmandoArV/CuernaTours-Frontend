import styles from "./DetailComponent.module.css";
export const Detail = ({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) => (
  <div className={styles.detailItem}>
    <span className={styles.label}>{label}</span>
    <span className={styles.value}>{value || "N/A"}</span>
  </div>
);
