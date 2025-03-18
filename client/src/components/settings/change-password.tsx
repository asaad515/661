import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
  newPassword: z
    .string()
    .min(8, "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل")
    .max(100, "كلمة المرور الجديدة طويلة جداً"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
});

type PasswordChangeForm = z.infer<typeof passwordChangeSchema>;

export default function ChangePasswordForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PasswordChangeForm>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: PasswordChangeForm) {
    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/auth/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      toast({
        title: "تم تغيير كلمة المرور",
        description: "تم تغيير كلمة المرور بنجاح",
      });

      form.reset();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل تغيير كلمة المرور. يرجى التحقق من كلمة المرور الحالية",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>كلمة المرور الحالية</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>كلمة المرور الجديدة</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>تأكيد كلمة المرور الجديدة</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "جاري تغيير كلمة المرور..." : "تغيير كلمة المرور"}
        </Button>
      </form>
    </Form>
  );
}
