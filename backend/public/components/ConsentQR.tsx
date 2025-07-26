/* src/components/ConsentQR.tsx */
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface Props {
  data: string | null | undefined;          // texto que irá codificado
  size?: number;
}

export const ConsentQR: React.FC<Props> = ({ data, size = 196 }) => {
  // fallback simple
  if (!data) {
    return (
      <div className="flex items-center justify-center w-[196px] h-[196px] bg-slate-200 rounded">
        <span className="text-sm text-slate-500">Sin datos</span>
      </div>
    );
  }

  return (
    <QRCodeSVG
      value={data}
      size={size}
      bgColor="#ffffff"
      fgColor="#000000"
      includeMargin
      className="rounded shadow"
    />
  );
};
