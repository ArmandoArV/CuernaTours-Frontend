"use client";
import React, { useState } from "react";
import styles from "./SearchComponent.module.css";
import { SearchRegular } from "@fluentui/react-icons";

interface SearchProps {
  onSearch: (searchTerm: string) => void;
}

const SearchComponent: React.FC<SearchProps> = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    onSearch(newSearchTerm);
  };

  return (
    <div className={styles["search-container"]}>
      <SearchRegular className={styles["search-icon"]} />
      <input
        type="text"
        className={styles["search-input"]}
        placeholder="Buscar"
        value={searchTerm}
        onChange={handleSearchChange}
      />
    </div>
  );
};

export default SearchComponent;
