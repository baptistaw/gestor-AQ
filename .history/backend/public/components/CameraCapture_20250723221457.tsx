
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CameraIcon, CameraIcon, CheckIcon, ArrowPathIcon, XMarkIcon } from './icons.tsx';

interface CameraCaptureProps {
  onConfirm: (signatureImage: string) => void;
  onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onConfirm, onClose }) => {
  const [image, setImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("No se pudo acceder a la cámara. Por favor, verifique los permisos e intente de nuevo.");
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      // Cleanup: stop all tracks on the stream when component unmounts
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    if(context){
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/png');
        setImage(dataUrl);
    }
  };

  const retakePhoto = () => {
    setImage(null);
  };
  
  const handleConfirm = () => {
      if(image) {
          onConfirm(image);
      }
  };

  return (
    <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Capturar Firma</h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200">
                <XMarkIcon className="h-6 w-6 text-slate-600"/>
            </button>
        </div>
      {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}
      <div className="relative aspect-video bg-slate-800 rounded-md overflow-hidden">
        {image ? (
          <img src={image} alt="Firma capturada" className="w-full h-full object-contain" />
        ) : (
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        )}
      </div>
      <div className="mt-4 flex justify-center gap-4">
        {image ? (
          <>
            <button
              onClick={retakePhoto}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ArrowPathIcon className="h-5 w-5"/>
              Tomar de Nuevo
            </button>
            <button
              onClick={handleConfirm}
              className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <CheckIcon className="h-5 w-5"/>
              Confirmar Firma
            </button>
          </>
        ) : (
          <button
            onClick={takePhoto}
            disabled={!!error}
            className="inline-flex items-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            <CameraIcon className="h-6 w-6"/>
            Tomar Foto
          </button>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraCapture;