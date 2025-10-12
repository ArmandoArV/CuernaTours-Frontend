import React from "react";
import styles from "./main.module.css";
import { ArrowNextFilled, ArrowPreviousFilled } from "@fluentui/react-icons";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = React.memo(
  ({ currentPage, totalPages, onPageChange }) => {
    return (
      <div className={styles.paginationContainer}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous Page"
          className={styles.paginationButton}
        >
          <ArrowPreviousFilled />
        </button>
        <span>{`${currentPage} de ${totalPages}`}</span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next Page"
          className={styles.paginationButton}
        >
          <ArrowNextFilled />
        </button>
      </div>
    );
  }
);
