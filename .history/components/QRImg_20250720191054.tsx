// frontend/components/QRImg.tsx
//-------------------------------------
// Devuelve un <img> con el PNG inline //
//-------------------------------------
import * as React from "react";
import QRCode from "qrcode";

interface QRImgProps {
  /** Texto que contendrá el QR */
  text: string;
  /** Lado del cuadrado en píxeles (default = 192) */
  size?: number;
  /** Color del módulo oscuro (hex o css) */
  darkColor?: string;
  /** Color de fondo claro  */
  lightColor?: string;
}

export const QRImg: React.FC<QRImgProps> = ({
  text,
  size = 192,
  darkColor = "#000000",
  lightColor = "#ffffff",
}) => {
  const [dataUrl, setDataUrl] = React.useState<string>("");

  React.useEffect(() => {
    (async () => {
      try {
        const url = await QRCode.toDataURL(text, {
          width:  size,
          margin: 1,
          color: {
            dark:  darkColor,
            light: lightColor,
          },
        });
        setDataUrl(url);
      } catch (err) {
        console.error("Error generando QR:", err);
      }
    })();
  }, [text, size, darkColor, lightColor]);

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center bg-slate-100 text-slate-400 rounded"
      >
        Cargando…
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      width={size}
      height={size}
      alt="Código QR"
      className="select-none"
    />
  );
};

export default QRImg;
