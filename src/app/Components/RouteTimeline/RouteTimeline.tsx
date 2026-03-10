"use client";

import styles from "./RouteTimeline.module.css";

export type RouteLocationType = "origin" | "stop" | "destination";

export interface RouteLocation {
  id?: string | number;
  label: string;
  type?: RouteLocationType;
}

interface RouteTimelineProps {
  locations: RouteLocation[];
}

export default function RouteTimeline({ locations }: RouteTimelineProps) {
  if (!locations?.length) return null;

  return (
    <div className={styles.routeSection}>
      {locations.map((location, index) => (
        <div
          key={location.id ?? `${location.label}-${index}`}
          className={`${styles.routeItem} anim-stagger`}
          style={{ "--i": index } as React.CSSProperties}
        >
          <div
            className={`${styles.outsideBubble} ${
              location.type ? styles[location.type] : ""
            }`}
          >
            <div className={styles.routeBubble}>{index + 1}</div>
          </div>

          <span className={styles.routeText}>{location.label}</span>
        </div>
      ))}
    </div>
  );
}
