import React, { useState } from 'react'
import { Button } from './button'
import { Input } from './input'
import { SearchInput, type SearchFilter } from './search-input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card'
import { Save, Trash2, Search, Plus } from 'lucide-react'

// تعريف خيارات البحث المتقدم للعرض التوضيحي
const searchFilters: SearchFilter[] = [
  {
    id: "category",
    label: "الفئة",
    options: [
      { value: "electronics", label: "إلكترونيات" },
      { value: "clothing", label: "ملابس" },
      { value: "books", label: "كتب" },
    ]
  },
  {
    id: "price",
    label: "نطاق السعر",
    options: [
      { value: "0-50", label: "أقل من 50" },
      { value: "50-100", label: "50 - 100" },
      { value: "100+", label: "أكثر من 100" },
    ]
  }
]

// اقتراحات البحث للعرض التوضيحي
const searchSuggestions = [
  "هاتف ذكي",
  "حاسوب محمول",
  "سماعات لاسلكية",
  "ساعة ذكية"
]

export const TestArabicComponents = () => {
  const [searchValue, setSearchValue] = useState("")

  const handleSearch = (value: string) => {
    setSearchValue(value)
    console.log("البحث عن:", value)
  }

  const handleFilterChange = (filterId: string, value: string) => {
    console.log("تغيير التصفية:", filterId, value)
  }

  return (
    <div className="p-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>مكونات واجهة المستخدم العربية</CardTitle>
          <CardDescription>عرض توضيحي للمكونات المتجاوبة مع اللغة العربية مع الرموز التوضيحية</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* قسم البحث المتقدم */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">البحث المتقدم</h3>
            <div className="space-y-4">
              <SearchInput
                placeholder="ابحث عن منتجات..."
                value={searchValue}
                onSearch={handleSearch}
                filters={searchFilters}
                suggestions={searchSuggestions}
                onFilterChange={handleFilterChange}
                className="max-w-2xl"
              />
              <p className="text-sm text-muted-foreground">
                جرب البحث عن "هاتف" أو "حاسوب" لرؤية الاقتراحات
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">الأزرار</h3>
            <div className="flex gap-2">
              <Button 
                tooltip="زر حفظ البيانات"
                showHelper
              >
                <Save className="w-4 h-4" />
                حفظ
              </Button>

              <Button 
                variant="destructive"
                tooltip="زر حذف العنصر"
                showHelper
              >
                <Trash2 className="w-4 h-4" />
                حذف
              </Button>

              <Button 
                variant="outline"
                tooltip="زر إضافة عنصر جديد"
                showHelper
              >
                <Plus className="w-4 h-4" />
                إضافة
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">حقول الإدخال</h3>
            <div className="space-y-2">
              <Input 
                placeholder="البحث..." 
                tooltip="اكتب كلمات البحث هنا"
                showHelper
              />

              <Input 
                type="email" 
                placeholder="البريد الإلكتروني"
                helperText="سيتم استخدام هذا البريد للتواصل معك"
                tooltip="أدخل بريدك الإلكتروني"
                showHelper
              />

              <Input 
                type="tel" 
                placeholder="رقم الهاتف"
                helperText="أدخل رقم الهاتف مع رمز البلد"
                tooltip="مثال: 9647801234567+"
                showHelper
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <Button variant="outline">إلغاء</Button>
          <Button>حفظ التغييرات</Button>
        </CardFooter>
      </Card>
    </div>
  )
}