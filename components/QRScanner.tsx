
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onScanError, onClose }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    const startScanner = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        // Try to start with environment camera (back camera)
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            // Stop scanner before calling success to avoid multiple triggers
            if (scanner.isScanning) {
              scanner.stop().then(() => {
                onScanSuccess(decodedText);
              }).catch(err => {
                console.error("Error stopping scanner after success:", err);
                onScanSuccess(decodedText);
              });
            } else {
              onScanSuccess(decodedText);
            }
          },
          (error) => {
            // Only report specific errors if needed, otherwise ignore noise
            // "No MultiFormat Readers" is common when no QR is in view
            if (typeof error === 'string' && !error.includes("No MultiFormat Readers")) {
              console.warn("QR Scan error:", error);
            }
          }
        );
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to start scanner with environment mode:", err);

        // Fallback: Try to get any camera
        try {
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length > 0) {
            // Try the first available camera
            await scanner.start(
              devices[0].id,
              {
                fps: 10,
                qrbox: { width: 250, height: 250 },
              },
              onScanSuccess,
              () => {}
            );
            setIsLoading(false);
          } else {
            throw new Error("No cameras found on device.");
          }
        } catch (fallbackErr) {
          console.error("Fallback scanner failed:", fallbackErr);
          setErrorMsg("Could not access camera. Please ensure you have granted permission.");
          setIsLoading(false);
          if (onScanError) onScanError(String(fallbackErr));
        }
      }
    };

    // Small delay to ensure the DOM element is ready
    const timer = setTimeout(() => {
      startScanner();
    }, 300);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().then(() => {
          scannerRef.current?.clear();
        }).catch(err => console.error("Error stopping scanner in cleanup:", err));
      }
    };
  }, [onScanSuccess, onScanError]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-[2.5rem] overflow-hidden shadow-2xl transition-all">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text-primary dark:text-white">Scan UPI QR Code</h2>
            <button
              onClick={onClose}
              className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="relative">
            <div
              id="qr-reader"
              className="overflow-hidden rounded-3xl bg-gray-100 dark:bg-gray-900 min-h-[300px] border-2 border-dashed border-gray-200 dark:border-gray-700"
            ></div>

            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/80 dark:bg-gray-900/80 rounded-3xl">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Initializing camera...</p>
              </div>
            )}

            {errorMsg && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-rose-50/90 dark:bg-rose-900/90 rounded-3xl p-6 text-center">
                <div className="w-16 h-16 bg-rose-100 dark:bg-rose-800 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-rose-600 dark:text-rose-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-rose-800 dark:text-rose-100 font-bold mb-2">Camera Error</p>
                <p className="text-rose-600 dark:text-rose-200 text-sm mb-6">{errorMsg}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-600/20"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Scan Overlay */}
            {!isLoading && !errorMsg && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-indigo-500 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.3)]">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-right-4 border-white rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-right-4 border-white rounded-br-lg"></div>

                  {/* Scanning line animation */}
                  <div className="absolute left-0 right-0 h-0.5 bg-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-scan"></div>
                </div>
              </div>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-text-secondary dark:text-gray-400">
            Point your camera at a UPI QR code
          </p>
        </div>
      </div>
      <style>{`
        @keyframes scan {
          0% { top: 0%; }
          100% { top: 100%; }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default QRScanner;
