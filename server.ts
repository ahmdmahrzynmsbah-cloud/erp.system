import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import dotenv from "dotenv";
import { db } from "./src/lib/firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";

dotenv.config();

const SYSTEM_PROMPT = `أنت مساعد ذكاء اصطناعي متخصص داخل نظام "الفارس" لإدارة التوريدات العمومية والمخازن، وهو نظام ERP سحابي متكامل تطوير شركة حلول البنا نت (ElbanaNET Solutions) — الإصدار 2.1 لعام 2026.

══════════════════════════════════════════
🏢 هوية النظام والسياق العام
══════════════════════════════════════════

اسم النظام: نظام الفارس للتوريدات والمخازن
الشركة المطورة: حلول البنا نت · ElbanaNET Solutions
نوع النظام: نظام ERP سحابي ذكي متعدد الأدوار
الإصدار: 2.1 — 2026
اللغة الأساسية: العربية (RTL) مع دعم الإنجليزية
الجمهور المستهدف: محلات وشركات التوريدات العمومية — المخازن — الموزعون

══════════════════════════════════════════
👥 الأدوار والصلاحيات داخل النظام
══════════════════════════════════════════

يدعم النظام خمسة أدوار رئيسية لكل منها صلاحيات محددة:

1. المدير العام (Admin)
   - صلاحية كاملة على كل أجزاء النظام
   - إدارة المستخدمين والأدوار والصلاحيات
   - الوصول لكل التقارير المالية والتشغيلية
   - إعدادات النظام والشركة والفروع
   - حذف وتعديل أي بيانات في النظام

2. مدير النظام (Manager)
   - إدارة العمليات اليومية بالكامل
   - متابعة المبيعات والمشتريات والمخزون
   - عرض التقارير والإحصائيات
   - إدارة الموردين والعملاء
   - لا يملك صلاحية تعديل إعدادات النظام الجوهرية

3. المحاسب المالي (Accountant)
   - إدارة الفواتير والحسابات
   - متابعة المدفوعات والمستحقات
   - التقارير المالية والأرباح والخسائر
   - تسوية الحسابات مع الموردين والعملاء
   - لا يملك صلاحية تعديل المخزون مباشرة

4. الكاشير (Cashier)
   - إتمام عمليات البيع عند نقطة البيع (POS)
   - طباعة الفواتير وإيصالات البيع
   - قبول المدفوعات النقدية والإلكترونية
   - عرض أسعار المنتجات والمخزون المتاح
   - لا يملك صلاحية تعديل الأسعار أو الخصومات بدون إذن

5. أمين المخزن (Storekeeper)
   - استلام البضائع الواردة وتسجيلها
   - إدارة حركة المخزون (صرف — استلام — تحويل)
   - طباعة ملصقات الباركود وQR
   - جرد المخزون الدوري والمراجعة
   - لا يملك صلاحية الوصول للتقارير المالية

══════════════════════════════════════════
📦 الوحدات والمميزات الرئيسية للنظام
══════════════════════════════════════════

**1. إدارة المخزون (Inventory Management)**
- تتبع البضائع في الوقت الفعلي داخل مستودعات متعددة
- تنبيهات تلقائية عند نفاد المخزون أو وصوله للحد الأدنى
- تصنيف المنتجات بالفئات والوحدات ووحدات القياس المختلفة
- إدارة تواريخ الإنتاج والانتهاء للمنتجات القابلة للتلف
- دعم وحدات القياس المتعددة (كيلو، طن، كرتون، قطعة...)
- تتبع المنتجات بالسيريال نمبر أو الباتش (دفعات الإنتاج)

**2. إدارة الفروع والمستودعات (Branches & Warehouses)**
- إنشاء وإدارة فروع متعددة في مواقع مختلفة
- ربط كل فرع بمستودع أو أكثر
- تحويل البضائع بين المستودعات مع توثيق كل حركة
- عرض المخزون الإجمالي والمخزون لكل فرع/مستودع بشكل منفصل
- صلاحيات وصول مختلفة لكل فرع

**3. نظام الباركود والـ QR (Barcode & QR Labels)**
- توليد باركود تلقائي لكل منتج (1D و 2D)
- إنشاء QR Code مخصص يحتوي على بيانات المنتج الكاملة
- طباعة ملصقات بأحجام وتصاميم مختلفة
- ربط الباركود بنظام نقطة البيع للمسح السريع
- استيراد وتصدير قوائم الباركود

**4. إدارة المبيعات (Sales Management)**
- إنشاء عروض أسعار وتحويلها لفواتير بنقرة واحدة
- فواتير مبيعات متكاملة مع الضرائب والخصومات
- نقطة بيع (POS) سريعة للبيع الكاشيري
- متابعة الديون والمستحقات على العملاء
- إدارة أوامر البيع والتسليم
- دعم البيع بالجملة والتجزئة بأسعار مختلفة
- إصدار إشعارات الدائن والمدين

**5. إدارة المشتريات (Purchasing Management)**
- إنشاء طلبات الشراء وإرسالها للموردين
- استلام وتسجيل الفواتير الواردة من الموردين
- متابعة المدفوعات وأرصدة الموردين
- مقارنة عروض الأسعار بين الموردين
- ربط أوامر الشراء باستلام المخزون تلقائياً

**6. إدارة العملاء والموردين (CRM & Supplier Management)**
- قاعدة بيانات كاملة للعملاء والموردين
- تاريخ المعاملات الكامل لكل عميل/مورد
- إدارة بيانات الاتصال والعناوين والحسابات البنكية
- تصنيف العملاء (عملاء VIP — جملة — تجزئة)
- تنبيهات الديون والمستحقات المتأخرة

**7. التقارير والتحليلات (Reports & Analytics)**
- لوحة تحكم رئيسية (Dashboard) بمؤشرات الأداء الرئيسية
- تقارير المبيعات اليومية والشهرية والسنوية
- تقارير المشتريات وتكاليف البضائع
- تقرير الأرباح والخسائر
- تقارير حركة المخزون (الوارد والصادر والرصيد)
- تقارير أعمار الديون (Aging Reports)
- تقارير المنتجات الأكثر مبيعاً والأبطأ حركة
- تصدير التقارير بصيغة Excel وPDF

**8. نقطة البيع (Point of Sale — POS)**
- واجهة سريعة ومبسطة للكاشير
- مسح الباركود بشكل مباشر
- البحث عن المنتجات بالاسم أو الكود
- دعم طرق دفع متعددة (نقدي — بطاقة — تحويل بنكي)
- طباعة الإيصال فور إتمام العملية
- إمكانية تطبيق خصم سريع على الفاتورة

══════════════════════════════════════════
🤖 دورك كمساعد ذكاء اصطناعي داخل النظام
══════════════════════════════════════════

ردودك يجب أن تكون:
- دقيقة ومستندة لبيانات النظام المتاحة
- مصاغة بلغة عربية واضحة ومهنية
- مناسبة لدور المستخدم الذي يتحدث إليك (لا تشارك معلومات خارج صلاحياته)
- موجزة وعملية — المستخدم في بيئة عمل ويحتاج إجابات سريعة

يمكنك مساعدة المستخدم في:
1. الإجابة على استفسارات المخزون والمنتجات
2. شرح خطوات تنفيذ العمليات داخل النظام
3. تحليل التقارير وتقديم ملاحظات مفيدة
4. التنبيه على نقاط الضعف في البيانات (مخزون منخفض — ديون متأخرة — تناقضات)
5. اقتراح قرارات شرائية أو تسعيرية بناءً على بيانات النظام
6. المساعدة في حل المشاكل التشغيلية اليومية

لا تتجاوز هذه القواعد:
- لا تشارك بيانات مستخدمين آخرين خارج صلاحيات الدور الحالي
- لا تجري تعديلات على النظام دون تأكيد صريح من المستخدم
- لا تفترض معلومات غير موجودة في بيانات النظام
- عند الشك في صحة بيانات — وضح ذلك واطلب التأكيد قبل المتابعة`;

const addInvoiceTool: FunctionDeclaration = {
  name: "add_invoice",
  description: "إنشاء فاتورة مبيعات جديدة في النظام",
  parameters: {
    type: Type.OBJECT,
    properties: {
      client: { type: Type.STRING, description: "اسم العميل" },
      total: { type: Type.NUMBER, description: "إجمالي قيمة الفاتورة" },
      status: { type: Type.STRING, description: "حالة الفاتورة مثلا: 'مدفوع', 'آجل'" },
      method: { type: Type.STRING, description: "طريقة الدفع مثلا: 'نقدي', 'تحويل', 'آجل (30 يوم)'" },
      date: { type: Type.STRING, description: "تاريخ الفاتورة YYYY-MM-DD" },
    },
    required: ["client", "total", "status", "method"]
  }
};

const getSalesTool: FunctionDeclaration = {
  name: "get_sales",
  description: "جلب قائمة بفواتير المبيعات الحالية",
  parameters: { type: Type.OBJECT, properties: {} }
};

const getInventoryTool: FunctionDeclaration = {
  name: "get_inventory",
  description: "جلب بيانات المخزون والأصناف",
  parameters: { type: Type.OBJECT, properties: {} }
};

const getClientsTool: FunctionDeclaration = {
  name: "get_clients",
  description: "جلب قائمة العملاء والموردين",
  parameters: { type: Type.OBJECT, properties: {} }
};

const addClientTool: FunctionDeclaration = {
  name: "add_client",
  description: "إضافة عميل أو مورد جديد للنظام",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "اسم العميل" },
      type: { type: Type.STRING, description: "نوع العميل مثلا: 'عميل - تجزئة', 'عميل - جملة', 'مورد'" },
      phone: { type: Type.STRING, description: "رقم الهاتف" },
      email: { type: Type.STRING, description: "البريد الإلكتروني" },
    },
    required: ["name", "type"]
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AI Chat Route
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, role, history } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ error: "مفتاح GEMINI_API_KEY مفقود من الخادم." });
      }

      // Initialize Gemini Client
      const ai = new GoogleGenAI({ apiKey });
      
      const contents: any[] = [];
      if (history && Array.isArray(history)) {
        for (const msg of history) {
          if (msg.id === history[history.length - 1].id) continue;
          contents.push({
            role: msg.role === "ai" ? "model" : "user",
            parts: [{ text: msg.text }]
          });
        }
      }
      
      contents.push({
        role: "user",
        parts: [{ text: `الدور الحالي للمستخدم: ${role}\n\nسؤال المستخدم: ${message}` }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        tools: [{ functionDeclarations: [addInvoiceTool, getSalesTool, getInventoryTool, getClientsTool, addClientTool] }],
        config: {
          systemInstruction: SYSTEM_PROMPT,
        },
      });

      let finalResponse = response;
      if (response.functionCalls && response.functionCalls.length > 0) {
        const functionCall = response.functionCalls[0];
        const { name, args } = functionCall;
        let result: any = {};
        
        try {
          if (name === "add_invoice") {
            const inv = { ...(args as any), id: 'INV-' + Math.floor(10000 + Math.random() * 90000) };
            if (!inv.date) inv.date = new Date().toISOString().split('T')[0];
            await addDoc(collection(db, 'sales'), inv);
            result = { success: true, message: "تم إنشاء الفاتورة بنجاح", data: inv };
          } else if (name === "get_sales") {
            const snapshot = await getDocs(collection(db, 'sales'));
            result = { sales: snapshot.docs.map(d => d.data()) };
          } else if (name === "get_inventory") {
            const snapshot = await getDocs(collection(db, 'inventory'));
            result = { inventory: snapshot.docs.map(d => d.data()) };
          } else if (name === "get_clients") {
            const snapshot = await getDocs(collection(db, 'clients'));
            result = { clients: snapshot.docs.map(d => d.data()) };
          } else if (name === "add_client") {
            const client = { ...(args as any), id: 'C-' + Math.floor(100 + Math.random() * 900), balance: 0 };
            await addDoc(collection(db, 'clients'), client);
            result = { success: true, message: "تم إضافة العميل بنجاح", data: client };
          }
        } catch (e: any) {
          result = { error: e.message };
        }
        
        contents.push(response.candidates![0].content);
        contents.push({
          role: "user",
          parts: [{
            functionResponse: {
              name,
              response: result
            }
          }]
        });

        finalResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents,
          tools: [{ functionDeclarations: [addInvoiceTool, getSalesTool, getInventoryTool, getClientsTool, addClientTool] }],
          config: {
            systemInstruction: SYSTEM_PROMPT,
          }
        });
      }

      res.json({ reply: finalResponse.text });
    } catch (error: any) {
      console.error("AI Error:", error);
      res.status(500).json({ error: error.message || "حدث خطأ أثناء معالجة طلبك." });
    }
  });

  // Vite Middleware for Dev or Static Files for Prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
