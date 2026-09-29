# Architecture Decision Records — شو نطبخ اليوم؟

Reference Version: 1.1  
Status: Accepted Direction — Implementation requires per-batch GO  
Last Updated: 2026-09-29

هذه سجلات اتجاه، لا تفويض تنفيذ. [Architecture](../architecture/ARCHITECTURE.md) هو المرجع الحاكم؛ [Roadmap](../roadmap/ROADMAP.md) يحدد البوابات، و[Validation Plan](../business/VALIDATION_PLAN.md) يحدد V00. نحافظ على ADR-001 إلى ADR-022 من مراجعة PWA-first، ونضيف ADR-023 إلى ADR-028 للقرارات النهائية الخاصة بالسوق والتحقق والمنتج والأعمال. تغيير قرار لاحق يسجل سببه وأثره بدل محو التاريخ.

## ADR-001 — Modular Monolith

- **Decision:** خادم واحد بوحدات identity/households/content/recommendations/memory/analytics وغيرها داخل Django.
- **Why:** تقليل التشغيل وتسهيل المعاملات والمراجعة لفريق صغير.
- **Trade-off:** حدود الوحدات تحتاج انضباطًا، والنشر الخلفي موحد.
- **When to reconsider:** اختناق مقاس أو فرق مستقلة أو حدود عزل لا تعالج داخل النظام، لا لمجرد توقع النمو.

## ADR-002 — Permanent Next.js Web/PWA client

- **Decision:** Next.js + TypeScript واجهة دائمة، والتثبيت اختياري؛ يستبدل قرار Flutter Android-first السابق.
- **Why:** رابط مباشر للكويت وAndroid/iPhone، وSEO ومشاركة واستخدام مستمر بعد native.
- **Trade-off:** اختلاف متصفحات وتخزين وتحديث PWA، وتشغيل Next.js له كلفة.
- **When to reconsider:** عائق مثبت في تجربة الويب؛ لا يعاد إلغاء الويب تلقائيًا بإطلاق native.

## ADR-003 — Django / DRF / Admin

- **Decision:** Django للأعمال والهوية، DRF للعقود، Admin للمحتوى بصلاحيات واضحة.
- **Why:** قدرات إدارة ومصادقة ومعاملات مجربة دون بناء CMS مستقل.
- **Trade-off:** Admin يحتاج تهيئة مراجعة وقبول محتوى؛ ليس تجربة محرر متقدمة.
- **When to reconsider:** فريق محتوى وحاجة تحرير مثبتة لا تخدمها الإدارة الحالية.

## ADR-004 — PostgreSQL والبحث المحدود

- **Decision:** قاعدة علائقية واحدة، وبحث مكونات بالأسماء والمرادفات؛ لا vector DB أو Elasticsearch.
- **Why:** اتساق علاقات الأسرة والوصفات والنسخ وتقليل التعقيد.
- **Trade-off:** البحث الدلالي الواسع غير متاح؛ التحرير اليدوي مهم.
- **When to reconsider:** فشل جودة/أداء بحث مقاس بعد تحسين القاموس والفهارس.

## ADR-005 — Deterministic server engine

- **Decision:** قواعد أهلية وترتيب في Django، حتى ثلاث وصفات معتمدة، دون AI لكل طلب.
- **Why:** سلوك قابل للاختبار والتفسير وكلفة متوقعة وتطابق العملاء.
- **Trade-off:** يحتاج محتوى وقواعد محررة وقد لا يغطي كل الحالات.
- **When to reconsider:** فجوة مثبتة بعد تحسين المحتوى والقواعد؛ لا تخفف الحساسية لأي تقنية بديلة.

## ADR-006 — Approved recipe versions

- **Decision:** هوية وصفة ثابتة ونسخ مراجعة غير قابلة للتعديل بعد الاعتماد؛ سحب واضح ونشر عام مستقل.
- **Why:** تتبع ما عرض وطُبخ، وضبط سلامة الحصص والمحتوى.
- **Trade-off:** جهد مراجعة وتخزين نسخ وإبطال snapshots.
- **When to reconsider:** حاجة تشغيلية مثبتة؛ لا يلغى أثر التاريخ أو المراجعة لتسهيل التحرير.

## ADR-007 — Arabic contextual ontology

- **Decision:** معرفات مكونات وaliases كويتية/سعودية/إماراتية وسياق ووحدات وحساسية؛ الغموض يطلب اختيارًا.
- **Why:** الاسم نفسه قد يختلف معناه، والمرادف ليس بديلًا آمنًا دائمًا.
- **Trade-off:** صيانة بشرية واختبارات سياق بدل تخمين آلي.
- **When to reconsider:** توسع لغوي/سوقي أو حالات التباس متكررة تستدعي إثراء النموذج.

## ADR-008 — Budget classes

- **Decision:** اقتصادي/متوسط/مرتفع كتقدير تحريري نسبي، لا أسعار متاجر ولا ضمان وفر.
- **Why:** قرار سريع دون تكامل أسعار أو ادعاء دقة غير موجودة.
- **Trade-off:** لا مبلغ نهائي ولا مقارنة حية للأسعار.
- **When to reconsider:** طلب موثق وشريك بيانات صالح وميزانية/حقوق، ضمن قرار مستقل.

## ADR-009 — Limited offline reads

- **Decision:** IndexedDB للوصفة بحصص محفوظة والتقدم المحلي وآخر المفضلة/اقتراحات قديمة؛ Cache Storage للـshell والصور؛ لا write queue.
- **Why:** استمرار القراءة والطبخ دون عبء مزامنة موزعة.
- **Trade-off:** لا توصية جديدة أو تغيير حصص غير منزلة أو تسجيل طبخ بلا شبكة؛ التخزين قابل للفقد.
- **When to reconsider:** حاجة مثبتة لكتابات offline مع استعداد لكلفة التعارض والأمان؛ ليست توسعة ضمنية.

## ADR-010 — AI deferred

- **Decision:** AI Chef بعد MVP فقط إذا ثبتت حاجة؛ لا AI API أو جداول أو تعدد مزودين الآن.
- **Why:** اختبار قيمة قرار الوجبة دون كلفة واحتمالات توليد غير آمن.
- **Trade-off:** تخصيص حر أقل؛ يعتمد المنتج على تغطية المحتوى.
- **When to reconsider:** طلب متكرر لا تخدمه القواعد، وتقييم منفعة وسلامة وسقف كلفة ومزود واحد.

## ADR-011 — No general jobs framework in MVP

- **Decision:** لا Celery/Redis أو منصة queue عامة؛ أوامر إدارية مجدولة للحاجة الفعلية مع مراقبة وإعادة آمنة.
- **Why:** تقليل البنية قبل وجود عبء حقيقي.
- **Trade-off:** بعض التشغيل اليدوي والتزام قياس فشل/زمن المهام.
- **When to reconsider:** مهام متكررة ثقيلة أو ضمانات retry/latency مثبتة لا تكفيها الأوامر.

## ADR-012 — One-owner household

- **Decision:** بالغ واحد وحساب يدير عائلة واحدة؛ لا ملفات أطفال أو دعوات أعضاء.
- **Why:** بداية بسيطة وملكية واضحة وبيانات أقل.
- **Trade-off:** لا تعاون متعدد الأفراد أو عدة عائلات بالحساب.
- **When to reconsider:** طلب متكرر وتصور صلاحيات وخصوصية وتسوية تعديلات مستقل.

## ADR-013 — Multi-client analytics

- **Decision:** event schema موحد بمنصة/إصدار/display mode ومصدر محدود، وحساب فريد عبر العملاء.
- **Why:** قياس العودة والقرار دون مضاعفة web وpwa أو native لاحقًا.
- **Trade-off:** تفاصيل التثبيت والإسناد غير كاملة؛ first-party يحتاج ضبطًا.
- **When to reconsider:** حاجة تحليل إضافية مثبتة ضمن مراجعة تقليل بيانات واحتفاظ.

## ADR-014 — Web sessions now / Native auth later

- **Decision:** Django sessions مع Secure HttpOnly cookies وSameSite وCSRF، وnative tokens لاحقًا فوق نفس users.
- **Why:** تسجيل ويب مناسب مع مصدر صلاحيات واحد؛ لا tokens في browser storage.
- **Trade-off:** يلزم routing/CSRF صحيحان ومصادقة native مستقلة لاحقًا.
- **When to reconsider:** تغير قنوات الدخول أو الأصل/المزود بقرار أمني؛ لا إلغاء CSRF لتسهيل الربط.

## ADR-015 — Monetization deferred

- **Decision:** لا دفع أو ads/affiliate/sponsored content في MVP؛ entitlements مستقبلًا خادمية مستقلة عن مصدر الدفع.
- **Why:** أولوية إثبات الاستخدام والعودة.
- **Trade-off:** لا اختبار إيراد فعلي في النسخة الأولى.
- **When to reconsider:** قيمة متكررة واستعداد دفع مثبت وتجربة وعقد امتثال ومزود معتمد.

## ADR-016 — Shared backend / API / data

- **Decision:** كل العملاء يستخدمون نفس users/household/content/memory/recommendations وعقود versioned مشتركة.
- **Why:** تبديل الجهاز لا ينشئ أسرة أو قواعد أو بيانات منفصلة.
- **Trade-off:** الحاجة لتوافق إصدارات متعددة واختبار عقود.
- **When to reconsider:** حدود قانونية/تشغيلية مثبتة تستدعي فصلًا؛ لا فصل حسب الواجهة لمجرد سهولته.

## ADR-017 — Public / private separation

- **Decision:** Public API allowlist ووصفات منشورة صراحة؛ /app محمي وnoindex وprivate/no-store؛ لا وصول DB من Next.js.
- **Why:** SEO ومشاركة دون كشف بيانات الأسرة أو جعل كل المحتوى عامًا.
- **Trade-off:** مساران قراءة وسياسات cache/metadata تحتاج اختبارًا.
- **When to reconsider:** ميزة مشاركة خاصة مستقبلية بإذن وعمر وإلغاء مستقلين؛ لا تمرير سياق الأسرة للعامة.

## ADR-018 — Native deferred until evidence

- **Decision:** Android/iOS إضافيان لاحقًا بعد N01 يثبت الحاجة؛ Flutter مرشح يعاد تقييمه.
- **Why:** تجنب كلفة واجهات ومتاجر قبل ثبوت الطلب؛ PWA تخدم المنصتين الآن.
- **Trade-off:** قيود تجربة متصفح في بعض الحالات.
- **When to reconsider:** عائق قدرة أو تجربة متكرر لا يحله الويب، وميزانية دعم واختبار.

## ADR-019 — No critical frontend business logic

- **Decision:** Django يملك الحساسية والحصص والأهلية والترتيب والملكية؛ الواجهة تعرض وتتحقق أوليًا فقط.
- **Why:** منع اختلاف النتائج والعملاء وطرق تجاوز القواعد.
- **Trade-off:** حساب جديد يحتاج الشبكة؛ offline مقيد باللقطة المنزلة.
- **When to reconsider:** متطلب offline أساسي مثبت يحتاج عقدًا وتوافقًا واختبارات مكافئة، لا نسخ قواعد عشوائيًا.

## ADR-020 — SEO / sharing permanent

- **Decision:** صفحات عامة صغيرة ذات HTML وcanonical/metadata/Sitemap وصور مرخصة وروابط مشاركة آمنة.
- **Why:** الويب قناة دائمة للاكتساب والوصول وليس صفحة تنزيل تطبيق فقط.
- **Trade-off:** مراجعة محتوى وحقوق وصيانة نشر وسحب؛ SEO لا يضمن نموًا.
- **When to reconsider:** نتائج قناة مقاسة تحدد حجم الاستثمار، ولا تبرر فهرسة بيانات خاصة.

## ADR-021 — App stores outside MVP path

- **Decision:** لا Play/Apple accounts أو signing أو native release ضمن M00–M31.
- **Why:** التجربة برابط HTTPS دون متطلبات متجر.
- **Trade-off:** لا اكتشاف عبر متجر ولا خصائص native الآن.
- **When to reconsider:** قرار N01 ثم بطاقات نشر منفصلة وأسعار/سياسات يتحقق منها وقتها.

## ADR-022 — Safe PWA update/version strategy

- **Decision:** فصل web_release/local_schema/recipe_version؛ تحديث ينتظر خارج الطبخ وعزل caches واختبار rollback وتبويبات.
- **Why:** تجنب فقد التقدم أو خلط نسخ المقادير وتسريب الحسابات.
- **Trade-off:** جهد ترقية/توافق وتنظيف ومحدودية معرفة السحب أثناء الانقطاع.
- **When to reconsider:** حادث أمني أو تغير تخزين/متصفح يستلزم تحديث السياسة مع حفظ التقدم قدر الإمكان.

## ADR-023 — Kuwait-first validation

- **Decision:** V00 مع 15–20 عائلة كويتية ثم Beta برنامج 20–50 في الكويت.
- **Why:** قرب المؤسس يسهل بحثًا ودعمًا رخيصين نسبيًا؛ هذا سبب اختيار لا دليل نجاح.
- **Trade-off:** عينة صغيرة وعلاقات شخصية وسوق محدود لا يمثل السعودية.
- **When to reconsider:** أدلة بحث تغير الفئة/السوق؛ يجب توثيق أثر التغيير على العينة والنتائج.

## ADR-024 — Saudi-first scale, subject to validation

- **Decision:** السعودية أول سوق توسع بالحجم بعد نجاح استخدام/عودة والتحقق السعودي المستقل.
- **Why:** إبقاء مسار النمو واضحًا دون تعميم الكويت.
- **Trade-off:** وقت محتوى وبحث وقنوات وخصوصية إضافي قبل التوسع.
- **When to reconsider:** بيانات سعودية أو اقتصادية تشير لتعديل التوقيت/الفئة/سوق التوسع.

## ADR-025 — V00 before implementation

- **Decision:** M00 → V00 يدوية → GO/MODIFY/STOP → M01 فقط عند GO؛ ثم عقد وGO لكل Batch.
- **Why:** اختبار الحاجة قبل كلفة البرمجيات والالتزام.
- **Trade-off:** تأخير كود مقصود مقابل تعلم؛ Concierge قد يبالغ بقيمة الخدمة الشخصية.
- **When to reconsider:** لا تتجاوز البوابة تلقائيًا؛ تعدل خطة تجربة بقرار موثق عند تغير فرضيتها أو قيودها.

## ADR-026 — Pantry optional

- **Decision:** pantry=empty طبيعي؛ الاقتراحات تعتمد أساسًا على السياق والتاريخ؛ المكونات تحسن الترتيب اختيارياً، بلا dependency على M14/M15.
- **Why:** القيمة قرار الوجبة لا إدخال وصيانة مخزون؛ تقليل friction.
- **Trade-off:** لا ادعاء كفاية مكونات أو نقصها عند الجهل، ومطابقة أقل تفصيلًا.
- **When to reconsider:** دليل مستخدم متكرر على قيمة/رغبة إدخال؛ حتى عند توسيعها لا تفرض دون مراجعة أثره على التفعيل والعودة.

## ADR-027 — Decision Engine + Household Memory

- **Decision:** المنتج مساعد قرار يتذكر الأسرة؛ المكتبة والتعريب والمخزون وسائل داعمة.
- **Why:** اختبار قيمة متكررة تتجاوز العثور على وصفة.
- **Trade-off:** يتطلب تفسيرًا وذاكرة وقبولًا لا مجرد عدد محتوى أو مشاهدات.
- **When to reconsider:** V00/Beta تكشف مشكلة مختلفة أو عدم تكرارها؛ تعديل التموضع يحتاج أدلة.

## ADR-028 — Unmeasured business benchmarks are not facts

- **Decision:** CAC Unknown until measured؛ لا نجاح/ربح/مدة/valuation مفترضة. نفرق cost نقدي ووقت المؤسس وكلفة إطلاق، ونعاير بعد 3–5 دفعات فعلية.
- **Why:** منع قرارات إنفاق مبنية على دقة وهمية.
- **Trade-off:** بعض التقديرات تبقى ranges وscenarios حتى تتوفر بيانات.
- **When to reconsider:** عند توفر قياس موثق بمقام ونافذة ومصدر؛ لا يصبح سيناريو واحد حقيقة دائمة.

