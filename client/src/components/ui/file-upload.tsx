import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Image } from "lucide-react";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  label?: string;
  accept?: string;
  maxSize?: number; // in MB
  name?: string;
}

export function FileUpload({
  onFileSelect,
  label = "اختر صورة",
  accept = "image/*",
  maxSize = 5,
  name = "image",
}: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);

    if (!file) return;

    // التحقق من حجم الملف
    if (file.size > maxSize * 1024 * 1024) {
      setError(`حجم الملف يجب أن يكون أقل من ${maxSize}MB`);
      return;
    }

    // إنشاء معاينة للصورة
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    onFileSelect(file);
  };

  return (
    <div className="space-y-1">
      <div className="flex flex-col items-center justify-center w-full">
        <Label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center w-full h-16 border border-dashed rounded-md cursor-pointer bg-muted/20 hover:bg-muted/30 transition-colors duration-200"
        >
          {preview ? (
            <img
              src={preview}
              alt="معاينة"
              className="w-full h-full object-contain rounded-md"
            />
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Image className="w-3 h-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">اضغط لإضافة صورة</span>
              </p>
            </div>
          )}
          <Input
            id="file-upload"
            name={name}
            type="file"
            className="hidden"
            accept={accept}
            onChange={handleFileChange}
          />
        </Label>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}