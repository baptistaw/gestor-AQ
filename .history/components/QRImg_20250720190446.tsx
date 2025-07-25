// components/QRImg.tsx
import React from "react";
import QRCode from "qrcode";

export function QRImg({ text, size = 256 }: { text: string; size?: number }) {
  const [url, setUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    QRCode.toDataURL(text, { margin: 1, width: size, color: { dark: "#1e293b" } })
      .then(setUrl)
      .catch(console.error);
  }, [text, size]);

  return url ? <img src={url} width={size} height={size} /> : null;
}
