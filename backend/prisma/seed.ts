import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  UserRole,
  AccountStatus,
  ContentType,
  KnowledgeSourceType,
  ContentLanguage,
  PublicationStatus,
} from "../generated/prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function hashPassword(plain: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

async function main() {
  console.log("🌱 Seeding Urunana platform database...");

  // 1. System Settings
  await prisma.systemSetting.upsert({
    where: { key: "MODERATION_DISTINCT_REPORTER_THRESHOLD" },
    update: { value: "3" },
    create: {
      key: "MODERATION_DISTINCT_REPORTER_THRESHOLD",
      value: "3",
      description: "Threshold of distinct reporters required to auto-hide Tier-2 content (FR-MOD-5, FR-ADM-9)",
    },
  });

  // 2. Topic Categories (FR-PUB-10)
  const categoriesData = [
    {
      slug: "history-heritage",
      nameRw: "Amateka n'Umurage",
      nameEn: "History & Heritage",
      nameFr: "Histoire et Patrimoine",
      description: "Amateka y'u Rwanda, ibirari by'abami, ingabo, n'ahantu ndangamurage.",
      isHealthOrMedicine: false,
    },
    {
      slug: "kinyarwanda-language",
      nameRw: "Ururimi rw'Ikinyarwanda",
      nameEn: "Kinyarwanda Language",
      nameFr: "Langue Kinyarwanda",
      description: "Imyandikire, amagambo mashya, inyito z'amazina, n'imikoreshereze y'ururimi.",
      isHealthOrMedicine: false,
    },
    {
      slug: "proverbs-riddles",
      nameRw: "Imigani n'Ibisakuzo",
      nameEn: "Proverbs & Riddles",
      nameFr: "Proverbes et Devinettes",
      description: "Imigani y'imigenurano, imigani miremire, ibisakuzo n'inyito zabyo.",
      isHealthOrMedicine: false,
    },
    {
      slug: "oral-traditions-stories",
      nameRw: "Ubuvanganzo Nyemvugo n'Inkuru",
      nameEn: "Oral Traditions & Stories",
      nameFr: "Traditions Orales et Récits",
      description: "Inkuru zo ku ziko, ibitekerezo bya kera, n'ibisingizo by'imiryango.",
      isHealthOrMedicine: false,
    },
    {
      slug: "traditional-practices",
      nameRw: "Imigenzo n'Ibyirorere Gakondo",
      nameEn: "Traditional Practices",
      nameFr: "Pratiques Traditionnelles",
      description: "Imihango yo gusaba no gukwa, kwita izina, kubandwa, n'imigenzo y'abakurambere.",
      isHealthOrMedicine: false,
    },
    {
      slug: "music-dance",
      nameRw: "Umuziki n'Imbyino Gakondo",
      nameEn: "Music & Dance",
      nameFr: "Musique et Danse Traditionnelles",
      description: "Indirimbo z'ingabo, ururirimbo, inanga, ibyivugo, n'imbyino z'amaraba.",
      isHealthOrMedicine: false,
    },
    {
      slug: "food-dietary",
      nameRw: "Ibyokurya n'Imirire Gakondo",
      nameEn: "Traditional Food & Diet",
      nameFr: "Alimentation et Cuisine Traditionnelle",
      description: "Ibyokurya gakondo by'abanyarwanda, amasuka, inzoga z'amasaka n'ubuki.",
      isHealthOrMedicine: false,
    },
    {
      slug: "clothing-adornment",
      nameRw: "Imyambarire n'Uburanga Gakondo",
      nameEn: "Traditional Clothing & Attire",
      nameFr: "Habillement et Parure Traditionnelle",
      description: "Inshabure, amashanana, amasunzu, n'uburyo bwo kurimbisha umubiri.",
      isHealthOrMedicine: false,
    },
    {
      slug: "traditional-knowledge-health",
      nameRw: "Ubumenyi n'Ubuvuzi Gakondo",
      nameEn: "Traditional Knowledge & Healing",
      nameFr: "Savoirs et Médecine Traditionnelle",
      description: "Ubumenyi ku bimera bivura, kumenya ibihe, inyenyeri n'ubuhinzi gakondo.",
      isHealthOrMedicine: true, // FR-MOD-13 triggers health disclaimer banner!
    },
    {
      slug: "cultural-events",
      nameRw: "Ibirori n'Imihango y'Umuco",
      nameEn: "Cultural Events",
      nameFr: "Événements Culturels",
      description: "Umuganura, Kwita Izina, ibitaramo gakondo, n'amaserukiramuco.",
      isHealthOrMedicine: false,
    },
    {
      slug: "contemporary-cultural-life",
      nameRw: "Ubuzima bw'Umuco bugezweho",
      nameEn: "Contemporary Rwandan Cultural Life",
      nameFr: "Vie Culturelle Rwandaise Contemporaine",
      description: "Uburyo urubyiruko ruhuza umuco n'iterambere rya none.",
      isHealthOrMedicine: false,
    },
  ];

  for (const cat of categoriesData) {
    await prisma.topicCategory.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
  }
  console.log(`✅ Seeded ${categoriesData.length} topic categories.`);

  // 3. Community Rules (Section 7, BR-1 to BR-18)
  const rulesData = [
    {
      ruleCode: "BR-1",
      titleRw: "Guhugura ibitekerezo, si abantu",
      titleEn: "Disagree with ideas, not people",
      titleFr: "Critiquer les idées, pas les personnes",
      descriptionRw: "Guhangana ku bitekerezo byemewe ariko nta gutuka cyangwa gusenya mugenzi wawe.",
      descriptionEn: "Critique ideas respectfully; personal attacks and insult are strictly prohibited.",
      descriptionFr: "Le débat d'idées est encouragé sans attaques personnelles.",
      tier: 3,
    },
    {
      ruleCode: "BR-2",
      titleRw: "Nta gutoteza cyangwa guhohotera",
      titleEn: "No harassment or bullying",
      titleFr: "Pas de harcèlement ni d'intimidation",
      descriptionRw: "Kubuza umutekano undi muntu ku bushake birabujijwe rwose.",
      descriptionEn: "Targeted harassment or repeated unwanted interaction will not be tolerated.",
      descriptionFr: "Tout harcèlement ciblé entraîne des sanctions immédiates.",
      tier: 3,
    },
    {
      ruleCode: "BR-3",
      titleRw: "Kwirinda urwango n'amagambo anezeza",
      titleEn: "No hate or dehumanizing content",
      titleFr: "Pas de discours de haine",
      descriptionRw: "Amagambo ahembera urwango cyangwa asuzugura ikiremwamuntu ahanishwa gusiba inyandiko ako kanya.",
      descriptionEn: "Hate speech and dehumanizing language are auto-hidden upon first report.",
      descriptionFr: "Les propos haineux sont immédiatement masqués dès le premier signalement.",
      tier: 1,
    },
    {
      ruleCode: "BR-4",
      titleRw: "Nta gutera ubwoba cyangwa gukangisha urugomo",
      titleEn: "No threats or encouragement of violence",
      titleFr: "Pas de menaces ou d'incitation à la violence",
      descriptionRw: "Gukangisha urugomo ku muntu cyangwa itsinda birabujijwe cyane.",
      descriptionEn: "Threats of physical harm will result in instant auto-hide and account suspension.",
      descriptionFr: "Toute menace physique est masquée sur-le-champ avec suspension du compte.",
      tier: 1,
    },
    {
      ruleCode: "BR-5",
      titleRw: "Kubaha ibanga ry'umuntu (Privacy)",
      titleEn: "Protect people's privacy",
      titleFr: "Respecter la vie privée",
      descriptionRw: "Gutangaza amakuru bwite y'undi muntu utabiherewe uruhushya birabujijwe.",
      descriptionEn: "Sharing private contact info, private messages, or sensitive personal data is prohibited.",
      descriptionFr: "La divulgation de données privées sans consentement est formellement interdite.",
      tier: 1,
    },
    {
      ruleCode: "BR-6",
      titleRw: "Sobanura inkomoko y'ubumenyi",
      titleEn: "Provide context for knowledge sources",
      titleFr: "Préciser la source des connaissances",
      descriptionRw: "Ntugashyireho ibitekerezo byawe bwite nk'aho ari ukuri kudasubirwaho; hitamo inkomoko nyayo.",
      descriptionEn: "Do not present personal memory as universal fact; clearly tag your knowledge source.",
      descriptionFr: "Ne présentez pas vos souvenirs personnels comme des vérités universelles sans contexte.",
      tier: 3,
    },
    {
      ruleCode: "BR-7",
      titleRw: "Inkuru zitandukanye zibana mu mahoro",
      titleEn: "Multiple versions can coexist",
      titleFr: "La pluralité des versions est respectée",
      descriptionRw: "Urunana rwubaha ko inkuru n'imigenzo bigira inyito zitandukanye mu duce dutandukanye.",
      descriptionEn: "Different versions of stories or traditions coexist freely; none is declared superior.",
      descriptionFr: "Différentes versions d'un récit traditionnel coexistent sans hiérarchisation.",
      tier: 3,
    },
    {
      ruleCode: "BR-8",
      titleRw: "Kwirinda guhimba ibitari byo",
      titleEn: "Do not knowingly fabricate information",
      titleFr: "Ne pas fabriquer délibérément de fausses informations",
      descriptionRw: "Guhimba amateka ukayagira ukuri kudasanzwe birabujijwe.",
      descriptionEn: "Fabricating historical or cultural facts and presenting them as truth is forbidden.",
      descriptionFr: "Présenter des fictions inventées comme faits authentiques est interdit.",
      tier: 3,
    },
    {
      ruleCode: "BR-9",
      titleRw: "Kubaha umutungo mu by'ubwenge",
      titleEn: "Respect intellectual ownership & credit sources",
      titleFr: "Respecter la propriété intellectuelle",
      descriptionRw: "Vuga umuntu cyangwa igitabo wakuyeho amakuru.",
      descriptionEn: "Credit tradition-bearers, elders, or publications whenever reproducing knowledge.",
      descriptionFr: "Mentionnez toujours vos sources et les aînés dépositaires du savoir.",
      tier: 2,
    },
    {
      ruleCode: "BR-10",
      titleRw: "Kuguma ku nsanganyamatsiko",
      titleEn: "Keep discussion relevant; no spam or derailing",
      titleFr: "Garder les discussions pertinentes",
      descriptionRw: "Ntukinjize kwamamaza cyangwa kuyobya ibiganiro ku zindi ngingo zitari umuco.",
      descriptionEn: "Keep comments pertinent to cultural inquiry; avoid commercial promotion or trolling.",
      descriptionFr: "Évitez le hors-sujet et les promotions commerciales abusives.",
      tier: 3,
    },
    {
      ruleCode: "BR-11",
      titleRw: "Kutiyitirira undi muntu",
      titleEn: "No impersonation",
      titleFr: "Usurpation d'identité interdite",
      descriptionRw: "Kwigira undi muntu cyangwa gukoresha amazina ye mu buriganya birabujijwe.",
      descriptionEn: "Creating accounts pretending to be real public figures or other contributors is blocked.",
      descriptionFr: "Prétendre être une autre personne physique ou morale est sanctionné.",
      tier: 2,
    },
    {
      ruleCode: "BR-12",
      titleRw: "Nta kwinjiza ibikorwa bya robot (Spam)",
      titleEn: "No spam or manipulation of engagement",
      titleFr: "Pas de spam ni de manipulation",
      descriptionRw: "Kwohereza ubutumwa busa bwinshi no gukoresha uburiganya mu gukwirakwiza inyandiko birahanwa.",
      descriptionEn: "Coordinated spam or synthetic engagement is auto-hidden once reported by 3+ distinct users.",
      descriptionFr: "Le spam coordonné est automatiquement masqué à partir de signalements distincts.",
      tier: 2,
    },
    {
      ruleCode: "BR-13",
      titleRw: "Kwitondera ingingo ziremereye mu mateka",
      titleEn: "Sensitive cultural topics require care",
      titleFr: "Sensibilité sur les thèmes délicats",
      descriptionRw: "Amateka n'umuco birakomeye; tanga ibitekerezo mu mwuka wo kubaka no kwigira hamwe.",
      descriptionEn: "Treat delicate historical narratives with responsibility and dignity.",
      descriptionFr: "Abordez les récits historiques délicats avec retenue et bienveillance.",
      tier: 3,
    },
    {
      ruleCode: "BR-14",
      titleRw: "Ubumenyi bw'imiti gakondo si inama z'ubuvuzi",
      titleEn: "Traditional health knowledge is not professional advice",
      titleFr: "Savoirs de santé non constitutifs d'avis médical",
      descriptionRw: "Inyandiko ku miti gakondo ni umurage gusa; ntibizigera bisimbura umuganga w'umwuga.",
      descriptionEn: "Cultural health posts carry mandatory non-removable disclaimers; consult doctors for care.",
      descriptionFr: "Documentation culturelle uniquement; consultez toujours des professionnels de santé.",
      tier: 1,
    },
    {
      ruleCode: "BR-15",
      titleRw: "Ubuyobozi buhana amakosa, ntibuhana ibitekerezo",
      titleEn: "Moderation targets rule violations, not viewpoints",
      titleFr: "Modération ciblée sur les règles, pas sur l'opinion",
      descriptionRw: "Nta muntu uzabuzwa ijambo kubera ko afite uburyo atangamo inkuru butandukanye n'ubw'abandi.",
      descriptionEn: "Content will never be removed solely for having a dissenting viewpoint.",
      descriptionFr: "Aucun contenu n'est supprimé simplement pour divergence de vue.",
      tier: 3,
    },
    {
      ruleCode: "BR-16",
      titleRw: "Ubutabera n'ubucamanza buciye mu mucyo",
      titleEn: "Moderation is logged and consistent",
      titleFr: "Actions de modération transparentes et journalisées",
      descriptionRw: "Buri cyemezo cyo guhagarika cyangwa gusiba inyandiko kigomba kwandikwa hamwe n'ingingo yishwe.",
      descriptionEn: "Every moderation action logs the exact community rule cited for full accountability.",
      descriptionFr: "Chaque action de modération consigne la règle spécifique enfreinte.",
      tier: 3,
    },
    {
      ruleCode: "BR-17",
      titleRw: "Gukosorana mu rukundo",
      titleEn: "Good-faith correction is encouraged over conflict",
      titleFr: "Correction bienveillante privilégiée",
      descriptionRw: "Niba mugenzi wawe yibeshye mu mvugo, mukosore mu kinyabupfura.",
      descriptionEn: "Offer polite clarifications in comment threads rather than attacking authors.",
      descriptionFr: "Privilégiez l'explication courtoise aux polémiques agressives.",
      tier: 3,
    },
    {
      ruleCode: "BR-18",
      titleRw: "Amategeko ashobora kuvugururwa",
      titleEn: "Rules may evolve transparently",
      titleFr: "Évolution concertée des règles",
      descriptionRw: "Amategeko yose azavugururwa azajya agaragaza itariki yavugururiweho.",
      descriptionEn: "Platform guidelines evolve with the pilot community with visible update dates.",
      descriptionFr: "Les règles de la communauté évoluent avec notification publique de la date de mise à jour.",
      tier: 3,
    },
  ];

  for (const rule of rulesData) {
    await prisma.communityRule.upsert({
      where: { ruleCode: rule.ruleCode },
      update: rule,
      create: rule,
    });
  }
  console.log(`✅ Seeded ${rulesData.length} community rules.`);

  // 4. Default Admin & Founding Contributors (FR-AUTH-1, FR-ADM-1, FR-PROF-5)
  const adminPassword = await hashPassword("AdminPassword123!");
  const demoPassword = await hashPassword("Urunana2026!");

  const admin = await prisma.user.upsert({
    where: { emailOrPhone: "admin@urunana.rw" },
    update: {},
    create: {
      username: "admin",
      displayName: "Urunana Administrator",
      emailOrPhone: "admin@urunana.rw",
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      isModerator: true,
      preferredLanguage: "rw",
      isFoundingContributor: true,
      foundingJoinDate: new Date(),
      accountStatus: AccountStatus.ACTIVE,
      statedAgeBand: "18+",
      communityRulesAccepted: true,
      communityRulesAcceptedAt: new Date(),
      bio: "Ubuyobozi bukuru bw'urubuga rwa Urunana, bufite inshingano zo kubungabunga amategeko n'ubusugire bw'umurage w'u Rwanda.",
    },
  });

  const contributor1 = await prisma.user.upsert({
    where: { emailOrPhone: "kalisa@urunana.rw" },
    update: {},
    create: {
      username: "kalisa_m",
      displayName: "Kalisa Mugisha",
      emailOrPhone: "kalisa@urunana.rw",
      passwordHash: demoPassword,
      role: UserRole.USER,
      isModerator: false,
      preferredLanguage: "rw",
      isFoundingContributor: true,
      foundingJoinDate: new Date(),
      accountStatus: AccountStatus.ACTIVE,
      statedAgeBand: "18+",
      communityRulesAccepted: true,
      communityRulesAcceptedAt: new Date(),
      bio: "Umushakashatsi n'umwanditsi ku mateka y'Ingoma z'u Rwanda, ibisekuru n'ubuvanganzo nyemvugo.",
      areasOfInterest: ["Amateka", "Ubuvanganzo", "Inanga"],
    },
  });

  const contributor2 = await prisma.user.upsert({
    where: { emailOrPhone: "keza@urunana.rw" },
    update: {},
    create: {
      username: "keza_uwase",
      displayName: "Keza Uwase",
      emailOrPhone: "keza@urunana.rw",
      passwordHash: demoPassword,
      role: UserRole.USER,
      isModerator: false,
      preferredLanguage: "rw",
      isFoundingContributor: true,
      foundingJoinDate: new Date(),
      accountStatus: AccountStatus.ACTIVE,
      statedAgeBand: "18+",
      communityRulesAccepted: true,
      communityRulesAcceptedAt: new Date(),
      bio: "Umusizi akaba n'umutoza w'itorero ry'imbyino gakondo z'i Rwanda.",
      areasOfInterest: ["Imbyino gakondo", "Imyambarire", "Ibisakuzo"],
    },
  });
  console.log("✅ Seeded Admin and 2 Founding Contributors.");

  // 5. Word of the Week (FR-DISC-7, FR-LANG-4)
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const word = await prisma.wordOfTheWeek.create({
    data: {
      word: "Urunana",
      pronunciation: "u-ru-na-na",
      explanationRw:
        "Urunana ni isano rikomeye cyangwa umurongo w'abantu bafatanye urunana mu gushyigikirana, gufatanya no gusigasira ubumwe n'umurage.",
      explanationEn:
        "Urunana symbolizes unbreakable solidarity and cohesion, where people link hands together to support each other and safeguard their heritage.",
      explanationFr:
        "Urunana désigne une chaîne humaine solidaire, où chacun se donne la main pour préserver la cohésion et le patrimoine commun.",
      culturalContext:
        "Mu muco w'Abanyarwanda, gufata urunana byakoreshwaga mu gukemura ibibazo bisaba ubufatanye, nko guhinga umuganda cyangwa gutabarana.",
      exampleSentenceRw: "Abaturage bafashe urunana mu gusana iteme ryari ryasenywe n'imvura.",
      exampleSentenceTranslation: "The villagers joined hands in solidarity to repair the bridge damaged by rain.",
      startDate: now,
      endDate: nextWeek,
      isActive: true,
      createdById: admin.id,
    },
  });
  console.log(`✅ Seeded Word of the Week: "${word.word}".`);

  // 6. Sample Publications
  // Post 1: Oral Tradition in Kinyarwanda
  const historyCat = await prisma.topicCategory.findUnique({ where: { slug: "history-heritage" } });
  const storiesCat = await prisma.topicCategory.findUnique({ where: { slug: "oral-traditions-stories" } });
  const healthCat = await prisma.topicCategory.findUnique({ where: { slug: "traditional-knowledge-health" } });
  const proverbsCat = await prisma.topicCategory.findUnique({ where: { slug: "proverbs-riddles" } });

  const pub1 = await prisma.publication.upsert({
    where: { slug: "umurage-wa-ruganzu-ndoli" },
    update: {},
    create: {
      title: "Umurage wa Ruganzu II Ndoli n'Inzira y'Ubutwari mu Mateka y'u Rwanda",
      slug: "umurage-wa-ruganzu-ndoli",
      authorId: contributor1.id,
      contentType: ContentType.ORAL_TRADITION,
      knowledgeSources: [KnowledgeSourceType.FAMILY_ORAL_TRADITION, KnowledgeSourceType.DOCUMENTED_HISTORY],
      contentLanguage: ContentLanguage.KINYARWANDA,
      sourceCitation: "Byabwiwe sekuru wa Kalisa Mugisha i Karongi mu mwaka wa 1982.",
      hostingLicenseGranted: true,
      researchUseConsent: true,
      status: PublicationStatus.PUBLISHED,
      publishedAt: new Date(),
      isFeatured: true,
      featuredAt: new Date(),
      summary: "Amateka n'ibitekerezo bya kera bigaragaza ubutwari bwa Ruganzu Ndoli n'uko yagaruye ingoma.",
      body: `Ruganzu II Ndoli ni umwe mu bami b'u Rwanda bazwi cyane mu buvanganzo nyemvugo no mu mateka y'ubutwari. Amateka amuvugaho ibitangaza byinshi byabereye mu duce dutandukanye tw'u Rwanda, uhereye ku bitare by'i Ruhango n'i Nyamagabe aho bavuga ko yasize ibirenge n'inzira y'imbwa ze.

Ubwo Ndoli yari amaze gukura, yagarutse mu Rwanda aturutse i Karagwe k'Abahinda aho yari yarahungishirijwe na Nyirasenge Nyabunyana. Yaje aherekejwe n'ingabo z'intwari zizwi ku izina ry'Ibisumizi. 

Uyu mugani n'amateka atwigisha ko ubutwari no kudatezuka ku ntego ari byo byatumye u Rwanda rwiganzura ibyago by'icyo gihe. Birakwiye ko urubyiruko rwa none rusigasira ubu buhanga buvuga ku budatsimburwa bw'abanyarwanda.`,
      categories: {
        create: [
          ...(historyCat ? [{ categoryId: historyCat.id }] : []),
          ...(storiesCat ? [{ categoryId: storiesCat.id }] : []),
        ],
      },
    },
  });

  // Post 2: Traditional Health Knowledge (with health disclaimer test case!)
  const pub2 = await prisma.publication.upsert({
    where: { slug: "ubumenyi-ku-byatsi-bivura-gakondo" },
    update: {},
    create: {
      title: "Ubumenyi Gakondo ku Byatsi Byifashishwaga mu Kuvura Inkorora n'Ibihaha",
      slug: "ubumenyi-ku-byatsi-bivura-gakondo",
      authorId: contributor2.id,
      contentType: ContentType.ARTICLE,
      knowledgeSources: [KnowledgeSourceType.COMMUNITY_PRACTICE, KnowledgeSourceType.PERSONAL_EXPERIENCE],
      contentLanguage: ContentLanguage.KINYARWANDA,
      sourceCitation: "Ubuvuzi gakondo bwo mu muryango w'abavuzi b'i Nyanza.",
      hostingLicenseGranted: true,
      researchUseConsent: false,
      status: PublicationStatus.PUBLISHED,
      publishedAt: new Date(),
      summary: "Inyandiko ivuga ku byatsi bya kera nk'umuravumba n'umutagara mu buvuzi gakondo.",
      body: `Mu muco nyarwanda wa kera, abakurambere bari bafite ubumenyi buhanitse mu gukoresha ibimera byo mu misozi y'u Rwanda mu kuvura indwara zitandukanye. 

Bimwe mu byatsi byakoreshwaga cyane harimo:
1. Umuravumba (Tetradenia riparia): Wakoreshwaga mu kuvura ibicurane no koroshya inkorora y'akayi. Amazi y'amababi yatogoshejwe yanyweshwaga buhoro.
2. Umutagara: Wakoreshwaga mu gukiza uburibwe mu gatuza.
3. Igicuncu: Cyifashishwaga mu gufasha igifu igihe umuntu yagize ikibazo cy'ububabare.

Iri bumenyi turabigaragaza nk'umurage gakondo n'amateka y'uko abanyarwanda bavurwaga mbere y'amavuriro ya kizungu. Ntabwo ubu bushakashatsi ari inama zo kwivura utabanje kugana muganga w'umwuga.`,
      categories: {
        create: [...(healthCat ? [{ categoryId: healthCat.id }] : [])],
      },
    },
  });

  // Post 3: Proverbs & Riddles (English/Mixed exploration)
  const pub3 = await prisma.publication.upsert({
    where: { slug: "wisdom-in-rwandan-proverbs-imigani" },
    update: {},
    create: {
      title: "Wisdom of Unity in Ancient Rwandan Proverbs (Imigani y'Imigenurano)",
      slug: "wisdom-in-rwandan-proverbs-imigani",
      authorId: contributor1.id,
      contentType: ContentType.LANGUAGE_EXPLANATION,
      knowledgeSources: [KnowledgeSourceType.RESEARCH_BASED],
      contentLanguage: ContentLanguage.MIXED,
      sourceCitation: "Inyandiko z'ubushakashatsi ku migani y'imigenurano, Inteko Nyarwanda y'Ururimi n'Umuco (RALC).",
      hostingLicenseGranted: true,
      researchUseConsent: true,
      status: PublicationStatus.PUBLISHED,
      publishedAt: new Date(),
      summary: "Exploring proverbs such as 'Abishyize hamwe ntakibananira' and their cultural significance.",
      body: `Rwandan proverbs (imigani y'imigenurano) are timeless capsules of cultural wisdom, moral ethics, and communal solidarity. 

One prominent proverb is:
"Abishyize hamwe ntakibananira" — meaning "When people unite with one heart, nothing is insurmountable."

Another proverb reflects patience in traditional life:
"Ubwenge burarahurwa" — wisdom is acquired from others, like sharing embers of fire from hearth to hearth.

These linguistic expressions preserve philosophical insights refined over centuries across Rwandan hills.`,
      categories: {
        create: [...(proverbsCat ? [{ categoryId: proverbsCat.id }] : [])],
      },
    },
  });

  // Add sample comments to pub1 (Threaded comment demo)
  const comment1 = await prisma.comment.create({
    data: {
      publicationId: pub1.id,
      authorId: contributor2.id,
      body: "Murakoze cyane ku busobanuro bwiza ku mateka ya Ruganzu Ndoli! Ese mwadutangariza niba hari amakuru ku buryo yambutse uruzi rw'Akanyaru?",
      isAlternativeVersion: false,
      status: "VISIBLE",
    },
  });

  // Reply to comment 1 (1 level of threading)
  await prisma.comment.create({
    data: {
      publicationId: pub1.id,
      authorId: contributor1.id,
      parentId: comment1.id,
      body: "Murakoze Keza! Yego, amateka avuga ko Ruganzu yambutse Akanyaru ahetswe n'Ibisumizi, akoresheje ingobyi y'urukangaga. Tuzabishyira mu nyandiko itaha.",
      isAlternativeVersion: false,
      status: "VISIBLE",
    },
  });

  console.log("✅ Seeded sample publications and discussion threads.");
  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
