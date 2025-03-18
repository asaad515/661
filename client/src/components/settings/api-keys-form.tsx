import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LOCAL_STORAGE_KEY, platformConfig, formSchema } from "./api-keys.config";
import type { FormData } from "./api-keys.config";
import { useToast } from "@/hooks/use-toast";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";

export default function ApiKeysForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: Object.fromEntries(
      Object.entries(platformConfig).map(([platform, config]) => [
        platform,
        Object.fromEntries(
          Object.entries(config.fields).map(([key]) => [key, ""])
        ),
      ])
    ),
  });

  // استرجاع البيانات المحفوظة عند تحميل النموذج
  useEffect(() => {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        form.reset(parsedData);
      } catch (error) {
        console.error("Error loading saved API keys:", error);
      }
    }
  }, [form]);

  async function onSubmit(data: FormData) {
    setIsSubmitting(true);
    try {
      // حفظ البيانات في LocalStorage
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));

      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ مفاتيح API في المتصفح",
      });
    } catch (error) {
      console.error("Error saving API keys:", error);
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل في حفظ مفاتيح API",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Accordion type="single" collapsible className="w-full">
          {Object.entries(platformConfig).map(([platformKey, platform]) => (
            <AccordionItem key={platformKey} value={platformKey}>
              <AccordionTrigger>{platform.title}</AccordionTrigger>
              <AccordionContent>
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    {platform.description}
                  </p>

                  <div className="space-y-4">
                    {Object.entries(platform.fields).map(([fieldKey, field]) => (
                      <FormField
                        key={fieldKey}
                        control={form.control}
                        name={`${platformKey}.${fieldKey}`}
                        render={({ field: formField }) => (
                          <FormItem>
                            <FormLabel>{field.label}</FormLabel>
                            <FormControl>
                              <Input
                                type={field.type}
                                placeholder={field.placeholder}
                                {...formField}
                                className="font-mono"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}

                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">تعليمات الإعداد:</h4>
                      <ul className="text-sm space-y-1 list-none">
                        {platform.instructions.map((instruction, i) => (
                          <li key={i}>{instruction}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "جاري الحفظ..." : "حفظ مفاتيح API"}
        </Button>
      </form>
    </Form>
  );
}