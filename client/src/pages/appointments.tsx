import { useState } from "react";
import { Printer } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Calendar as CalendarIcon, Plus, CheckCircle, XCircle, Clock, History } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { type Appointment, type Customer, insertAppointmentSchema } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

type NewAppointmentForm = {
  title: string;
  description: string;
  customerId: number;
  date: Date;
  duration: number;
  notes: string;
};

type AppointmentStatus = "scheduled" | "completed" | "cancelled";

const statusIcons: Record<AppointmentStatus, JSX.Element> = {
  scheduled: <Clock className="h-4 w-4 text-blue-500" />,
  completed: <CheckCircle className="h-4 w-4 text-green-500" />,
  cancelled: <XCircle className="h-4 w-4 text-red-500" />,
};

const statusColors: Record<AppointmentStatus, string> = {
  scheduled: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusText: Record<AppointmentStatus, string> = {
  scheduled: "قيد الانتظار",
  completed: "مكتمل",
  cancelled: "ملغي",
};

export default function AppointmentsPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const { toast } = useToast();
  const [reportDateRange, setReportDateRange] = useState({
    startDate: new Date(new Date().setDate(1)), // First day of current month
    endDate: new Date()
  });

  const appointmentForm = useForm<NewAppointmentForm>({
    resolver: zodResolver(insertAppointmentSchema),
    defaultValues: {
      title: "",
      description: "",
      customerId: 0,
      date: new Date(),
      duration: 30,
      notes: "",
    },
  });

  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 2,
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: NewAppointmentForm) => {
      console.log("Sending appointment data:", data);
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "فشل في إنشاء الموعد");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "تم إنشاء الموعد بنجاح",
        description: "تم إضافة الموعد الجديد إلى جدول المواعيد",
      });
      setIsNewAppointmentOpen(false);
      appointmentForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: AppointmentStatus }) => {
      console.log("Updating appointment status:", { id, status });
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "فشل في تحديث حالة الموعد");
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities", "appointments"] });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/reports/appointments", reportDateRange.startDate, reportDateRange.endDate] 
      });

      toast({
        title: "تم تحديث حالة الموعد بنجاح",
      });
    },
    onError: (error: Error) => {
      console.error("Error updating appointment:", error);
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmitAppointment = (data: NewAppointmentForm) => {
    createAppointmentMutation.mutate(data);
  };

  const handleStatusChange = (id: number, newStatus: AppointmentStatus) => {
    console.log("Changing appointment status:", { id, newStatus });
    updateAppointmentMutation.mutate({ id, status: newStatus });
  };

  const selectedDateAppointments = appointments.filter(
    (appointment) =>
      format(new Date(appointment.date), "yyyy-MM-dd") ===
      format(selectedDate, "yyyy-MM-dd")
  );

  const { data: appointmentsReport, isLoading: isReportLoading } = useQuery({
    queryKey: [
      "/api/reports/appointments",
      reportDateRange.startDate,
      reportDateRange.endDate
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: reportDateRange.startDate.toISOString(),
        endDate: reportDateRange.endDate.toISOString()
      });
      const res = await fetch(`/api/reports/appointments?${params}`);
      if (!res.ok) throw new Error("فشل في جلب تقرير المواعيد");
      return res.json();
    },
    enabled: !!reportDateRange.startDate && !!reportDateRange.endDate
  });

  // Add new query for activities
  const { data: appointmentActivities = [], isLoading: isActivitiesLoading } = useQuery({
    queryKey: ["/api/activities", "appointments"],
    queryFn: async () => {
      const res = await fetch("/api/activities?entityType=appointments");
      if (!res.ok) throw new Error("فشل في جلب سجل الحركات");
      return res.json();
    }
  });

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <CalendarIcon className="h-6 w-6" />
          <h1 className="text-2xl font-bold">المواعيد</h1>
        </div>

        <div className="flex items-center gap-4">
          <Dialog open={isNewAppointmentOpen} onOpenChange={setIsNewAppointmentOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                إضافة موعد جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm overflow-y-auto max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>إضافة موعد جديد</DialogTitle>
              </DialogHeader>

              <Form {...appointmentForm}>
                <form
                  onSubmit={appointmentForm.handleSubmit(onSubmitAppointment)}
                  className="space-y-2"
                >
                  <FormField
                    control={appointmentForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>عنوان الموعد</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={appointmentForm.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>العميل</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(Number(value))}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر العميل" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {customers.map((customer: Customer) => (
                              <SelectItem
                                key={customer.id}
                                value={customer.id.toString()}
                              >
                                {customer.name} - {customer.phone}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={appointmentForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الوصف</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={appointmentForm.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>التاريخ</FormLabel>
                        <FormControl>
                          <div className="border rounded-md p-2">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              className="w-full"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={appointmentForm.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المدة (بالدقائق)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="1"
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={appointmentForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ملاحظات</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full mt-4"
                    disabled={createAppointmentMutation.isPending}
                  >
                    {createAppointmentMutation.isPending && (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent ml-2" />
                    )}
                    إضافة الموعد
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar">التقويم</TabsTrigger>
          <TabsTrigger value="reports">التقارير والإحصائيات</TabsTrigger>
          <TabsTrigger value="activities">سجل الحركات</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="md:max-w-sm">
              <CardHeader>
                <CardTitle>التقويم</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => setSelectedDate(date || new Date())}
                  className="rounded-md border"
                  locale={ar}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  مواعيد {format(selectedDate, "yyyy/MM/dd", { locale: ar })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="text-center py-4">جاري التحميل...</div>
                  ) : selectedDateAppointments.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      لا توجد مواعيد لهذا اليوم
                    </div>
                  ) : (
                    selectedDateAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="p-4 border rounded-lg hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-start gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <div className={`p-2 rounded-full ${statusColors[appointment.status as AppointmentStatus]}`}>
                                    {statusIcons[appointment.status as AppointmentStatus]}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>حالة الموعد: {statusText[appointment.status as AppointmentStatus]}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <div>
                              <h4 className="font-medium">{appointment.title}</h4>
                              {appointment.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {appointment.description}
                                </p>
                              )}
                              <p className="text-sm mt-1">
                                {customers.find((c: Customer) => c.id === appointment.customerId)?.name}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(appointment.date), "p", { locale: ar })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-4">
                          <span className="text-sm text-muted-foreground">
                            المدة: {appointment.duration} دقيقة
                          </span>
                          <div className="flex gap-2">
                            {appointment.status === "scheduled" && (
                              <>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-green-600 hover:text-green-700"
                                    onClick={() => handleStatusChange(appointment.id, "completed")}
                                  >
                                    <CheckCircle className="h-4 w-4 ml-1" />
                                    إكمال
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-blue-600 hover:text-blue-700"
                                    onClick={() => window.print()}
                                  >
                                    <Printer className="h-4 w-4 ml-1" />
                                    طباعة
                                  </Button>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleStatusChange(appointment.id, "cancelled")}
                                >
                                  <XCircle className="h-4 w-4 ml-1" />
                                  إلغاء
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        {appointment.notes && (
                          <p className="text-sm text-muted-foreground mt-2 border-t pt-2">
                            {appointment.notes}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تقرير المواعيد</CardTitle>
              <div className="flex gap-4 mt-4">
                <div>
                  <p className="text-sm font-medium mb-2">من تاريخ</p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline">
                        {format(reportDateRange.startDate, "yyyy/MM/dd", { locale: ar })}
                        <CalendarIcon className="ml-2 h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <Calendar
                        mode="single"
                        selected={reportDateRange.startDate}
                        onSelect={(date) =>
                          setReportDateRange((prev) => ({
                            ...prev,
                            startDate: date || prev.startDate
                          }))
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">إلى تاريخ</p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline">
                        {format(reportDateRange.endDate, "yyyy/MM/dd", { locale: ar })}
                        <CalendarIcon className="ml-2 h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <Calendar
                        mode="single"
                        selected={reportDateRange.endDate}
                        onSelect={(date) =>
                          setReportDateRange((prev) => ({
                            ...prev,
                            endDate: date || prev.endDate
                          }))
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isReportLoading ? (
                <div className="text-center py-8">جاري تحميل التقرير...</div>
              ) : appointmentsReport ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                          {appointmentsReport.summary.totalAppointments}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          إجمالي المواعيد
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-600">
                          {appointmentsReport.summary.completedAppointments}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          المواعيد المكتملة
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-red-600">
                          {appointmentsReport.summary.cancelledAppointments}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          المواعيد الملغاة
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-blue-600">
                          {appointmentsReport.summary.pendingAppointments}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          المواعيد المعلقة
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>توزيع المواعيد حسب الساعة</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={appointmentsReport.timeAnalysis.hourlyDistribution}>
                            <XAxis dataKey="hour" />
                            <YAxis />
                            <RechartsTooltip />
                            <Bar
                              dataKey="count"
                              fill="var(--primary)"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>التوزيع اليومي للمواعيد</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {appointmentsReport.timeAnalysis.dailyDistribution.map(
                          (day) => (
                            <div
                              key={day.date}
                              className="flex items-center justify-between"
                            >
                              <div>
                                <p className="font-medium">
                                  {format(new Date(day.date), "yyyy/MM/dd", {
                                    locale: ar,
                                  })}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  نسبة الإكمال: {day.completionRate}%
                                </p>
                              </div>
                              <div className="flex gap-4 text-sm">
                                <span className="text-green-600">
                                  مكتمل: {day.completed}
                                </span>
                                <span className="text-red-600">
                                  ملغي: {day.cancelled}
                                </span>
                                <span className="text-blue-600">
                                  معلق: {day.pending}
                                </span>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>أفضل العملاء</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {appointmentsReport.customerAnalysis.map((customer) => (
                          <div
                            key={customer.customerId}
                            className="flex items-center justify-between"
                          >
                            <div>
                              <p className="font-medium">{customer.name}</p>
                              <p className="text-sm text-muted-foreground">
                                عدد المواعيد: {customer.totalAppointments}
                              </p>
                            </div>
                            <div className="text-sm">
                              <span className="text-green-600">
                                نسبة الإكمال: {customer.loyaltyScore}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد بيانات متاحة للفترة المحددة
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                سجل حركات المواعيد
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isActivitiesLoading ? (
                <div className="text-center py-8">جاري تحميل سجل الحركات...</div>
              ) : appointmentActivities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد حركات مسجلة
                </div>
              ) : (
                <div className="space-y-4">
                  {appointmentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="p-4 border rounded-lg hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">
                            {activity.details.title}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            تغيير الحالة من {activity.details.oldStatus} إلى{" "}
                            {activity.details.newStatus}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(activity.timestamp), "PPpp", {
                            locale: ar,
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}