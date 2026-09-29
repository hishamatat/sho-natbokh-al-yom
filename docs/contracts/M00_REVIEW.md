# M00 — Architecture Review Record

Review Version: 1.0  
Reviewed Against: Architecture and Roadmap Version 1.1  
Review Date: 2026-09-29  
Status: Accepted by owner  
Implementation Authorization: V00 manual validation only, under its approved Mini-Contract

## Review objective

التأكد من أن المرجع الحالي متماسك وقابل للانتقال إلى تجربة تحقق يدوية، من دون إنشاء برنامج أو افتراض نجاح تجاري. شملت المراجعة Architecture وRoadmap وADRs وBusiness Growth Thesis وValidation Plan وREADME.

## Decisions confirmed by the documents

1. التموضع: **Decision Engine + Household Memory for Arab families**؛ المنتج ليس تطبيق وصفات فقط ولا مولد وصفات بالذكاء الاصطناعي.
2. السوق: الكويت للتحقق أولًا، والسعودية للتوسع بالحجم بعد تحقق سعودي مستقل؛ لا تعميم تلقائي لنتائج الكويت.
3. التسلسل: M00 → V00 → GO/MODIFY/STOP → M01 عند GO فقط، ثم Mini-Contract وGO مستقلان لكل دفعة.
4. التقنية المستقبلية: Web/PWA دائم بـNext.js وTypeScript، وخادم Django/DRF/Admin وقاعدة PostgreSQL ضمن Modular Monolith متعدد العملاء.
5. Pantry اختيارية؛ pantry=empty حالة سليمة، ولا تعتمد M18 أو M19 أو M20 على M14/M15.
6. التوصيات حتمية وعلى الخادم، من وصفات معتمدة، مع ذاكرة الوجبات وحتى ثلاثة خيارات.
7. Offline قراءة محدودة ووضع طبخ وتقدم محلي؛ لا مزامنة كتابات معقدة.
8. AI والدفع وNative والمتاجر والإعلانات خارج MVP وتحتاج أدلة وبوابات مستقلة.
9. أرقام الأعمال غير المثبتة فرضيات أو نطاقات تخطيطية؛ **CAC = Unknown until measured**.
10. لا تستنتج مدة المشروع من عدد الدفعات؛ تعاير السرعة بعد أول 3–5 دفعات تنفيذية فعلية.

## Consistency checks

| الرحلة | النتيجة |
|---|---|
| زائر يفتح وصفة عامة | تمر عبر Public Web وPublic API، دون بيانات عائلة أو Cookie خاصة بالمحتوى العام |
| عائلة جديدة تطلب قرارًا دون Pantry | مسار مقبول من onboarding إلى Today؛ السياق الأساسي يكفي والتوصية لا تعتمد على M14/M15 |
| مستخدم يطبخ مع انقطاع الشبكة | يقرأ وصفة نُزلت مسبقًا ويحفظ تقدمًا محليًا؛ لا يسجل cooked today قبل عودة الاتصال |
| مستخدم يبدل الحساب | تمسح اللقطات الخاصة ويمنع الطلب المتأخر من إعادة بيانات الحساب السابق |
| عميل Native مستقبلي | يدخل إلى نفس الحساب والبيانات عبر auth مناسب للموبايل، دون نقل جلسة المتصفح أو تكرار قواعد الأعمال |

## Findings

- لا يوجد تعارض يجعل السعودية سوق التحقق الأول.
- لا يوجد اعتماد تقني يجعل Pantry شرطًا لطلب التوصية أو شاشة Today.
- فصل Public/Private متسق مع SEO والمشاركة والخصوصية.
- حدود offline والتحديث الآمن متسقة: القراءة المحلية فقط، مع إصدارات منفصلة للواجهة والبيانات المحلية والوصفة.
- V00 موصوفة كتجربة يدوية، وليست Batch برمجية ولا تصريح تواصل تلقائي.
- معايير GO في Validation Plan هي قواعد قرار داخلية مقترحة، وليست benchmark سوقيًا أو ضمان نجاح.

## Defaults proposed for V00 contract

- Target: 20 عائلة، والحد الأدنى لتحليل بوابة GO هو 15 عائلة أكملت الجلسة الأولى؛ كل المشاركين بلا معرفة أو علاقة سابقة بالمؤسس.
- Market: عائلات في الكويت، يمثلها بالغ يشارك فعليًا في قرار الوجبة.
- Observation: أربعة أسابيع كحد أقصى من أول جلسة؛ يغلق التجنيد في نهاية الأسبوع الثاني، ثم تقرير وقرار خلال خمسة أيام من الإغلاق.
- Incentive: لا حافز افتراضيًا؛ أي حافز يحتاج اعتمادًا قبل الدعوة ويثبت كتكلفة بحث.
- Pantry: سؤال اختياري دائمًا، مع اختبار رحلة كاملة من دونها.
- Data: لا بيانات مشاركين أو أرقام هواتف داخل هذا المشروع أو Git؛ سجل البحث الخاص منفصل عن خريطة الاتصال.
- Outreach: ينفذه المؤسس فقط عبر مجموعات أو جهات أو وسطاء يصلون إلى عائلات لا يعرفها؛ لا إرسال آلي ولا مشاركة لمعارفه في العينة.

## Exit assessment

المراجعة الفنية والتجارية للمرجع **مكتملة وناجحة**، واعتمدها مالك المشروع بتاريخ 2026-09-29. كما أعطى GO لـ[V00 Mini-Contract](V00_MINI_CONTRACT.md) بشرط أن تكون كل العائلات بلا معرفة أو علاقة سابقة به. لا يجيز هذا السجل تنفيذ M01 أو أي برمجة.

## Files reviewed

- `README.md`
- `docs/architecture/ARCHITECTURE.md`
- `docs/roadmap/ROADMAP.md`
- `docs/adr/ARCHITECTURE_DECISIONS.md`
- `docs/business/BUSINESS_GROWTH_THESIS.md`
- `docs/business/VALIDATION_PLAN.md`

## Change record

- 2026-09-29 — Initial M00 consistency review completed; no implementation authorized.
- 2026-09-29 — Owner accepted M00 and approved V00 manual validation with all participants unknown to the founder.
