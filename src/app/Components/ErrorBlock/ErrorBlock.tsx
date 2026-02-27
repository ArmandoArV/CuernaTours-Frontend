"use client";

import {
  MessageBar,
  MessageBarBody,
  Button
} from "@fluentui/react-components";

interface Props {
  message: string;
  onRetry?: () => void;
}

export default function ErrorBlock({ message, onRetry }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <MessageBar intent="error">
        <MessageBarBody>{message}</MessageBarBody>
      </MessageBar>

      {onRetry && (
        <Button appearance="primary" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  );
}
