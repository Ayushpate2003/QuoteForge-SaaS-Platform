'use client';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import getCroppedImg from '@/lib/cropImage';

interface ImageCropperProps {
  image: string;
  aspect?: number;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
}

export default function ImageCropper({ image, aspect = 1, onCropComplete, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onCropCompleteInternal = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    setLoading(true);
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels, rotation);
      if (croppedImage) {
        onCropComplete(croppedImage);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Crop Image</h2>
            <p className="text-xs text-slate-500 font-medium">Adjust the selection for your logo/signature</p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative h-[400px] bg-slate-900">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteInternal}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
          />
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <ZoomOut className="w-4 h-4 text-slate-400" />
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-indigo-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
              />
              <ZoomIn className="w-4 h-4 text-slate-400" />
            </div>
            
            <div className="flex items-center gap-4">
              <RotateCcw className="w-4 h-4 text-slate-400" />
              <input
                type="range"
                value={rotation}
                min={0}
                max={360}
                step={1}
                aria-labelledby="Rotation"
                onChange={(e) => setRotation(Number(e.target.value))}
                className="flex-1 accent-indigo-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-400 w-8">{rotation}°</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
            <Button onClick={handleCrop} isLoading={loading} className="px-8 gap-2">
              <Check className="w-4 h-4" /> Apply Crop
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
