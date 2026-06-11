
import React, { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onScanError, onClose }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(onScanSuccess, (error) => {
      if (onScanError) onScanError(error);
    });

    return () => {
      scanner.clear().catch(error => {
        console.error("Failed to clear html5QrcodeScanner", error);
      });
    };
  }, [onScanSuccess, onScanError]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-center mb-6 text-text-primary dark:text-white">Scan UPI QR Code</h2>
        <div id="qr-reader" className="overflow-hidden rounded-xl"></div>
        <p className="mt-4 text-center text-sm text-text-secondary dark:text-gray-400">
          Point your camera at a UPI QR code
        </p>
      </div>
    </div>
  );
};

export default QRScanner;
