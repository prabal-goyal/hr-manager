/* ============================================================
   docsprofile.jsx — Naveya ESS "Documents" + "Profile" (M4 + M3)
   Composes ONLY from window.G2 (tokens) + window.UI2 (kit). Classic-
   JSX-runtime IIFE, no imports/exports, inline styles only. CONTENT
   ONLY — no rail/shell; renders into the full-bleed content region
   to the right of the approved home-a.jsx rail.

   Grammar coverage (design/v2/kit.jsx "register grammar", see also
   design/mockups/SubstitutionBoard.dc.html):
     (a) ActionBar — breadcrumb left, one read-only export action right
         (employees cannot write documents/profile fields — M4 §2/§3).
     (b) Masthead — kicker + Anek title + Devanagari companion + meta
         (identity) left, a plain (non-money) mono count/figure right.
     (c) One or more Register sections, full width, hairline rows,
         left accent gutter, double-rule totals footer.
     (d) StatusFooter — the governing HR-governance rule + a count tag.

   DOCUMENTS (M4): the employee's own document register. Every VERIFIED
   record carries the brass Seal (never a generic check badge). Exactly
   ONE row is flagged (rule 6, "one open field") — an OPEN
   DocumentUpdateRequest — whose action cell is the *only* write
   affordance on the page: "Upload response". Everything else is
   read-only; there is no create/edit path to StaffDocument from ESS
   (spec M4 §2: documents.write is not granted to Employee).

   PROFILE (M3): a service-book register — Employment, Qualifications,
   Statutory & bank IDs (masked-by-default, explicit reveal), and the
   dated Service Record (ServiceRecord entity) closing with the
   employee's CURRENT CTC as the ledger's "everything sums" total.
   Fields are never inline-editable; the per-row affordance is
   "Request change" (or a Mark showing a change already pending HR
   review) — matching M3's HR-owned-record model.
   ============================================================ */
(function () {
  const { useState, Fragment } = React;
  const G = window.G2;
  const {
    useTheme, useLang, ActionBar, Masthead, StatusFooter, Register,
    Mark, Seal, MaskedValue, Chip, Button, Figure, EmptyState, Fonts,
  } = window.UI2;

  // ---------------------------------------------------------------
  // Local i18n overlay — this page's own copy on top of the kit's
  // shared STRINGS table (nav.*, common.download/reveal/hide already
  // live there and are reused as-is).
  // ---------------------------------------------------------------
  const LOCAL_STRINGS = {
    en: {
      "docs.kicker": "DOCUMENT REGISTER", "docs.title": "Documents", "docs.titleDeva": "दस्तावेज़",
      "docs.recordsKicker": "RECORDS ON FILE", "docs.recordsSub": "7 verified · 1 expiring · 1 open request",
      "docs.downloadAll": "Download all",
      "docs.colDocument": "DOCUMENT", "docs.colCategory": "CATEGORY", "docs.colVerifiedOn": "VERIFIED ON",
      "docs.colExpiry": "EXPIRY", "docs.colState": "STATE",
      "docs.noExpiry": "No expiry", "docs.due": "Due", "docs.requestedByHR": "Requested by HR",
      "docs.uploadResponse": "Upload response", "docs.verified": "Verified", "docs.expiringSoon": "Expiring soon",
      "docs.inDays": "in 99 days", "docs.expired": "Expired",
      "docs.catIdentity": "Identity", "docs.catStatutory": "Statutory ID", "docs.catQualification": "Qualification",
      "docs.catVerification": "Verification", "docs.catContract": "Contract", "docs.catBanking": "Banking",
      "docs.totalsLabel": "TOTAL", "docs.totalVerified": "7 verified", "docs.totalExpiry": "1 expiring · 1 expired",
      "docs.totalOpen": "1 open request",
      "docs.governingRule": "Only HR can add or replace a document on file — you may only respond to an open request.",
      "docs.footerTag": "9 RECORDS · 1 OPEN",
      "docs.emptyTitle": "No documents on file yet", "docs.emptyDesc": "HR will upload your onboarding documents here.",
      "docs.aadhaar": "Aadhaar Card", "docs.pan": "PAN Card", "docs.uan": "UAN / PF Enrolment",
      "docs.bed": "B.Ed Degree Certificate", "docs.ctet": "CTET Certificate (Paper II)",
      "docs.police": "Police Verification Certificate", "docs.contract": "Employment Contract",
      "docs.bankProof": "Bank Account Proof (Cancelled Cheque)",
      "docs.policeUpdated": "Updated Police Verification Certificate",

      "profile.kicker": "SERVICE BOOK", "profile.title": "Profile", "profile.titleDeva": "प्रोफ़ाइल",
      "profile.tenureKicker": "LENGTH OF SERVICE", "profile.tenureSub": "Since 01 Apr 2019",
      "profile.downloadServiceBook": "Download service book",
      "profile.colField": "FIELD", "profile.colValue": "VALUE", "profile.colAction": "ACTION",
      "profile.requestChange": "Request change", "profile.changeRequested": "Change requested",
      "profile.totalFields": "TOTAL", "profile.totalPending": "1 pending",
      "profile.sectionEmployment": "Employment", "profile.sectionQualifications": "Qualifications",
      "profile.sectionStatutory": "Statutory & bank IDs", "profile.sectionService": "Service record",
      "profile.colQualification": "QUALIFICATION", "profile.colInstitution": "INSTITUTION", "profile.colYear": "YEAR",
      "profile.colVerification": "VERIFICATION", "profile.colEvent": "EVENT", "profile.colEffectiveDate": "EFFECTIVE DATE",
      "profile.colDetails": "DETAILS", "profile.colNewCTC": "NEW CTC", "profile.currentCTC": "CURRENT CTC",
      "profile.governingRule": "Profile fields are HR-governed — request a change instead of editing directly.",
      "profile.footerTag": "4 SECTIONS · 1 PENDING CHANGE", "profile.notApplicable": "Not applicable",
      "profile.fieldEmployeeId": "Employee ID", "profile.fieldStaffCategory": "Staff category",
      "profile.fieldEmploymentType": "Employment type", "profile.fieldDOJ": "Date of joining",
      "profile.fieldConfirmationDate": "Confirmation date", "profile.fieldVacationStaff": "Vacation staff",
      "profile.fieldReportingCampus": "Reporting campus", "profile.fieldNoticePeriod": "Notice period",
      "profile.fieldContractStatus": "Contract status",
      "profile.valuePGT": "PGT · Post Graduate Teacher, Chemistry", "profile.valuePermanent": "Permanent",
      "profile.valueYes": "Yes — Earned Leave in lieu of summer vacation",
      "profile.valueCampus": "Sunrise Public School, Sunrise Vidya Group", "profile.valueNoticePeriod": "60 days",
      "profile.valueActive": "Active",
      "profile.qualBEd": "B.Ed — Bachelor of Education", "profile.qualMSc": "M.Sc — Chemistry",
      "profile.qualCTET": "CTET — Paper II (Science & Maths)",
      "profile.instRIE": "Regional Institute of Education, Bhopal",
      "profile.instDAVV": "Devi Ahilya Vishwavidyalaya, Indore", "profile.instCBSE": "CBSE",
      "profile.fieldPAN": "PAN", "profile.fieldAadhaar": "Aadhaar", "profile.fieldUAN": "UAN (EPFO)",
      "profile.fieldESIC": "ESIC number", "profile.fieldBankAccount": "Bank account number",
      "profile.fieldIFSC": "IFSC", "profile.fieldBankBranch": "Bank name & branch",
      "profile.valueBankBranch": "HDFC Bank, Vijay Nagar, Indore",
      "profile.eventJoined": "JOINED", "profile.eventConfirmed": "CONFIRMED", "profile.eventPromoted": "PROMOTED",
      "profile.eventRevised": "REVISED",
      "profile.detailJoined": "Appointed as TGT Chemistry, Sunrise Public School",
      "profile.detailConfirmed": "Probation completed; confirmed as TGT Chemistry",
      "profile.detailPromoted": "Promoted to PGT Chemistry",
      "profile.detailRevised24": "Annual increment", "profile.detailRevised25": "Annual increment",

      "combo.documents": "Documents", "combo.profile": "Profile",
    },
    hi: {
      "docs.kicker": "दस्तावेज़ रजिस्टर", "docs.title": "दस्तावेज़", "docs.titleDeva": "दस्तावेज़",
      "docs.recordsKicker": "फ़ाइल में रिकॉर्ड", "docs.recordsSub": "7 सत्यापित · 1 समाप्ति निकट · 1 खुला अनुरोध",
      "docs.downloadAll": "सभी डाउनलोड करें",
      "docs.colDocument": "दस्तावेज़", "docs.colCategory": "श्रेणी", "docs.colVerifiedOn": "सत्यापित दिनांक",
      "docs.colExpiry": "समाप्ति", "docs.colState": "स्थिति",
      "docs.noExpiry": "कोई समाप्ति नहीं", "docs.due": "देय", "docs.requestedByHR": "HR द्वारा अनुरोधित",
      "docs.uploadResponse": "प्रतिक्रिया अपलोड करें", "docs.verified": "सत्यापित", "docs.expiringSoon": "जल्द समाप्त",
      "docs.inDays": "99 दिनों में", "docs.expired": "समाप्त",
      "docs.catIdentity": "पहचान", "docs.catStatutory": "सांविधिक आईडी", "docs.catQualification": "योग्यता",
      "docs.catVerification": "सत्यापन", "docs.catContract": "अनुबंध", "docs.catBanking": "बैंकिंग",
      "docs.totalsLabel": "कुल", "docs.totalVerified": "7 सत्यापित", "docs.totalExpiry": "1 समाप्ति निकट · 1 समाप्त",
      "docs.totalOpen": "1 खुला अनुरोध",
      "docs.governingRule": "केवल HR ही फ़ाइल में दस्तावेज़ जोड़ या बदल सकता है — आप केवल किसी खुले अनुरोध का उत्तर दे सकते हैं।",
      "docs.footerTag": "9 रिकॉर्ड · 1 खुला",
      "docs.emptyTitle": "अभी तक कोई दस्तावेज़ फ़ाइल में नहीं", "docs.emptyDesc": "HR यहां आपके ऑनबोर्डिंग दस्तावेज़ अपलोड करेगा।",
      "docs.aadhaar": "आधार कार्ड", "docs.pan": "पैन कार्ड", "docs.uan": "UAN / PF पंजीकरण",
      "docs.bed": "बी.एड डिग्री प्रमाणपत्र", "docs.ctet": "CTET प्रमाणपत्र (पेपर II)",
      "docs.police": "पुलिस सत्यापन प्रमाणपत्र", "docs.contract": "रोजगार अनुबंध",
      "docs.bankProof": "बैंक खाता प्रमाण (कैंसिल्ड चेक)",
      "docs.policeUpdated": "अद्यतन पुलिस सत्यापन प्रमाणपत्र",

      "profile.kicker": "सर्विस बुक", "profile.title": "प्रोफ़ाइल", "profile.titleDeva": "प्रोफ़ाइल",
      "profile.tenureKicker": "सेवा अवधि", "profile.tenureSub": "01 अप्रैल 2019 से",
      "profile.downloadServiceBook": "सर्विस बुक डाउनलोड करें",
      "profile.colField": "क्षेत्र", "profile.colValue": "मान", "profile.colAction": "कार्रवाई",
      "profile.requestChange": "परिवर्तन हेतु अनुरोध करें", "profile.changeRequested": "परिवर्तन अनुरोधित",
      "profile.totalFields": "कुल", "profile.totalPending": "1 लंबित",
      "profile.sectionEmployment": "रोजगार", "profile.sectionQualifications": "योग्यताएं",
      "profile.sectionStatutory": "सांविधिक व बैंक आईडी", "profile.sectionService": "सेवा अभिलेख",
      "profile.colQualification": "योग्यता", "profile.colInstitution": "संस्थान", "profile.colYear": "वर्ष",
      "profile.colVerification": "सत्यापन", "profile.colEvent": "घटना", "profile.colEffectiveDate": "प्रभावी तिथि",
      "profile.colDetails": "विवरण", "profile.colNewCTC": "नई CTC", "profile.currentCTC": "वर्तमान CTC",
      "profile.governingRule": "प्रोफ़ाइल फ़ील्ड HR-नियंत्रित हैं — सीधे संपादित करने के बजाय परिवर्तन हेतु अनुरोध करें।",
      "profile.footerTag": "4 अनुभाग · 1 लंबित परिवर्तन", "profile.notApplicable": "लागू नहीं",
      "profile.fieldEmployeeId": "कर्मचारी आईडी", "profile.fieldStaffCategory": "स्टाफ श्रेणी",
      "profile.fieldEmploymentType": "रोजगार प्रकार", "profile.fieldDOJ": "नियुक्ति तिथि",
      "profile.fieldConfirmationDate": "पुष्टिकरण तिथि", "profile.fieldVacationStaff": "वेकेशन स्टाफ",
      "profile.fieldReportingCampus": "रिपोर्टिंग परिसर", "profile.fieldNoticePeriod": "नोटिस अवधि",
      "profile.fieldContractStatus": "अनुबंध स्थिति",
      "profile.valuePGT": "PGT · स्नातकोत्तर शिक्षक, रसायन विज्ञान", "profile.valuePermanent": "स्थायी",
      "profile.valueYes": "हां — ग्रीष्मकालीन अवकाश के बदले अर्जित अवकाश",
      "profile.valueCampus": "Sunrise Public School, Sunrise Vidya Group", "profile.valueNoticePeriod": "60 दिन",
      "profile.valueActive": "सक्रिय",
      "profile.qualBEd": "बी.एड — बैचलर ऑफ एजुकेशन", "profile.qualMSc": "एम.एससी — रसायन विज्ञान",
      "profile.qualCTET": "CTET — पेपर II (विज्ञान व गणित)",
      "profile.instRIE": "क्षेत्रीय शिक्षा संस्थान, भोपाल",
      "profile.instDAVV": "देवी अहिल्या विश्वविद्यालय, इंदौर", "profile.instCBSE": "CBSE",
      "profile.fieldPAN": "पैन", "profile.fieldAadhaar": "आधार", "profile.fieldUAN": "UAN (EPFO)",
      "profile.fieldESIC": "ESIC नंबर", "profile.fieldBankAccount": "बैंक खाता संख्या",
      "profile.fieldIFSC": "IFSC", "profile.fieldBankBranch": "बैंक शाखा",
      "profile.valueBankBranch": "HDFC Bank, विजय नगर, इंदौर",
      "profile.eventJoined": "नियुक्त", "profile.eventConfirmed": "पुष्ट", "profile.eventPromoted": "पदोन्नत",
      "profile.eventRevised": "संशोधित",
      "profile.detailJoined": "TGT रसायन विज्ञान के रूप में नियुक्त, Sunrise Public School",
      "profile.detailConfirmed": "परिवीक्षा पूर्ण; TGT रसायन विज्ञान के रूप में पुष्टि",
      "profile.detailPromoted": "PGT रसायन विज्ञान के पद पर पदोन्नत",
      "profile.detailRevised24": "वार्षिक वेतन वृद्धि", "profile.detailRevised25": "वार्षिक वेतन वृद्धि",

      "combo.documents": "दस्तावेज़", "combo.profile": "प्रोफ़ाइल",
    },
  };
  function useT() {
    const { t: tBase, lang } = useLang();
    const t = (key) => {
      const table = LOCAL_STRINGS[lang] || LOCAL_STRINGS.en;
      if (table[key] !== undefined) return table[key];
      return tBase(key);
    };
    return { t, lang };
  }

  // ---------------------------------------------------------------
  // Shared demo identity — same employee across both registers.
  // ---------------------------------------------------------------
  const EMPLOYEE = {
    name: "Priya Sharma", id: "NAV-0142", role: "PGT · Chemistry",
    campus: "Sunrise Public School", group: "Sunrise Vidya Group",
  };

  // ---------------------------------------------------------------
  // CountFigure — Masthead's `right` slot for a plain (non-money)
  // mono count, matching Masthead's own figureKicker/Figure layout
  // without routing through Figure's ₹-prefixed inr() formatting.
  // ---------------------------------------------------------------
  function CountFigure({ kicker, value, sub }) {
    const { c } = useTheme();
    return (
      <Fragment>
        {kicker && (
          <div style={{ fontFamily: Fonts.mono, fontSize: G.metric.minMonoCaps, letterSpacing: ".13em", textTransform: "uppercase", color: c.inkMuted }}>{kicker}</div>
        )}
        <div style={{ fontFamily: Fonts.mono, fontSize: 34, fontWeight: 600, letterSpacing: "-0.02em", color: c.ink, fontFeatureSettings: "'tnum' 1, 'lnum' 1" }}>{value}</div>
        {sub && <div style={{ fontFamily: Fonts.sans, fontSize: 11.5, color: c.inkMuted, marginTop: 2 }}>{sub}</div>}
      </Fragment>
    );
  }

  function SectionTitle({ children }) {
    const { c } = useTheme();
    return (
      <div style={{
        fontFamily: Fonts.mono, fontSize: 10.5, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase",
        color: c.inkMuted, padding: `${G.sp[5]}px ${G.sp[6]}px ${G.sp[1]}px`,
      }}>{children}</div>
    );
  }

  function DocCell({ title, sub, masked, full }) {
    const { c } = useTheme();
    return (
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: Fonts.sans, fontSize: 13.5, fontWeight: 600, color: c.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
        {masked
          ? <MaskedValue masked={masked} full={full} size={11} style={{ marginTop: 2 }} />
          : sub ? <div style={{ fontFamily: Fonts.sans, fontSize: 11.5, color: c.inkMuted, marginTop: 2 }}>{sub}</div> : null}
      </div>
    );
  }

  // =================================================================
  // DOCUMENTS — M4. Employee-facing document register + the one
  // open DocumentUpdateRequest (upload-response is the only write).
  // =================================================================
  function DocumentsPage() {
    const { c } = useTheme();
    const { t } = useT();

    const columns = [
      { key: "doc", label: t("docs.colDocument"), flex: 2.4, align: "left" },
      { key: "category", label: t("docs.colCategory"), width: 148, align: "left" },
      { key: "verifiedOn", label: t("docs.colVerifiedOn"), width: 108, align: "right", mono: true },
      { key: "expiry", label: t("docs.colExpiry"), width: 148, align: "right", mono: true },
      { key: "state", label: t("docs.colState"), width: 188, align: "left" },
    ];

    const dash = <span style={{ color: c.inkFaint }}>{t("docs.noExpiry")}</span>;

    const rows = [
      {
        key: "aadhaar",
        cells: {
          doc: <DocCell title={t("docs.aadhaar")} masked="XXXX XXXX 4821" full="2418 6650 4821" />,
          category: <Chip tone="neutral" size="sm" uppercase>{t("docs.catIdentity")}</Chip>,
          verifiedOn: "14 Feb 2023", expiry: dash,
          state: <Seal label={t("docs.verified")} date="14 Feb 23" size={34} />,
        },
      },
      {
        key: "pan",
        cells: {
          doc: <DocCell title={t("docs.pan")} masked="XXXXX1234Z" full="AFZPS1234Z" />,
          category: <Chip tone="neutral" size="sm" uppercase>{t("docs.catStatutory")}</Chip>,
          verifiedOn: "14 Feb 2023", expiry: dash,
          state: <Seal label={t("docs.verified")} date="14 Feb 23" size={34} />,
        },
      },
      {
        key: "uan",
        cells: {
          doc: <DocCell title={t("docs.uan")} masked="1007XXXXXX45" full="100712345645" />,
          category: <Chip tone="neutral" size="sm" uppercase>{t("docs.catStatutory")}</Chip>,
          verifiedOn: "01 Apr 2019", expiry: dash,
          state: <Seal label={t("docs.verified")} date="01 Apr 19" size={34} />,
        },
      },
      {
        key: "bed",
        cells: {
          doc: <DocCell title={t("docs.bed")} sub="Regional Institute of Education, Bhopal · 2018" />,
          category: <Chip tone="neutral" size="sm" uppercase>{t("docs.catQualification")}</Chip>,
          verifiedOn: "02 Jun 2019", expiry: dash,
          state: <Seal label={t("docs.verified")} date="02 Jun 19" size={34} />,
        },
      },
      {
        key: "ctet",
        cells: {
          doc: <DocCell title={t("docs.ctet")} sub="CBSE · 2019" />,
          category: <Chip tone="neutral" size="sm" uppercase>{t("docs.catQualification")}</Chip>,
          verifiedOn: "02 Jun 2019",
          expiry: (
            <div>
              <div style={{ color: c.seal, fontWeight: 600 }}>18 Nov 2026</div>
              <div style={{ fontFamily: Fonts.sans, fontSize: 10, color: c.seal, marginTop: 1 }}>{t("docs.inDays")}</div>
            </div>
          ),
          state: <Mark tone="seal" glyph="◍">{t("docs.expiringSoon")}</Mark>,
        },
        tone: "seal",
      },
      {
        key: "police",
        cells: {
          doc: <DocCell title={t("docs.police")} sub="—" />,
          category: <Chip tone="neutral" size="sm" uppercase>{t("docs.catVerification")}</Chip>,
          verifiedOn: "30 Jan 2022",
          expiry: <span style={{ color: c.danger, fontWeight: 600 }}>30 Jan 2026</span>,
          state: <Mark tone="danger" glyph="▣">{t("docs.expired")}</Mark>,
        },
        tone: "danger",
      },
      {
        key: "contract",
        cells: {
          doc: <DocCell title={t("docs.contract")} sub="Permanent · PGT Chemistry" />,
          category: <Chip tone="neutral" size="sm" uppercase>{t("docs.catContract")}</Chip>,
          verifiedOn: "01 Apr 2019", expiry: dash,
          state: <Seal label={t("docs.verified")} date="01 Apr 19" size={34} />,
        },
      },
      {
        key: "bank",
        cells: {
          doc: <DocCell title={t("docs.bankProof")} masked="XXXXXXXX4821" full="50100123454821" />,
          category: <Chip tone="neutral" size="sm" uppercase>{t("docs.catBanking")}</Chip>,
          verifiedOn: "01 Apr 2019", expiry: dash,
          state: <Seal label={t("docs.verified")} date="01 Apr 19" size={34} />,
        },
      },
      {
        key: "police-request",
        cells: {
          doc: <DocCell title={t("docs.policeUpdated")} sub={`${t("docs.requestedByHR")} · 28 Jul 2026`} />,
          category: <Chip tone="warning" size="sm" uppercase>{t("docs.catVerification")}</Chip>,
          verifiedOn: <span style={{ color: c.inkFaint }}>—</span>,
          expiry: <span style={{ color: c.seal, fontWeight: 600 }}>{t("docs.due")} 15 Aug 2026</span>,
          state: <Button variant="accent" size="sm" onClick={() => {}}>{t("docs.uploadResponse")}</Button>,
        },
        flagged: true,
      },
    ];

    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: c.bg }}>
        <ActionBar breadcrumbs={[t("nav.home"), t("docs.title")]}>
          <Button variant="ghost" size="sm">{t("docs.downloadAll")}</Button>
        </ActionBar>
        <Masthead
          kicker={t("docs.kicker")}
          title={t("docs.title")}
          titleDeva={t("docs.titleDeva")}
          meta={`${EMPLOYEE.name} · ${EMPLOYEE.id} · ${EMPLOYEE.campus}`}
          right={<CountFigure kicker={t("docs.recordsKicker")} value="09" sub={t("docs.recordsSub")} />}
        />
        <div style={{ flex: 1, overflow: "auto" }}>
          <Register
            columns={columns}
            rows={rows}
            rowHeight={56}
            totals={{
              label: t("docs.totalsLabel"), labelSpan: 2,
              cells: { verifiedOn: t("docs.totalVerified"), expiry: t("docs.totalExpiry"), state: t("docs.totalOpen") },
            }}
            emptyState={<EmptyState illustration="documents" title={t("docs.emptyTitle")} description={t("docs.emptyDesc")} />}
          />
        </div>
        <StatusFooter rule={t("docs.governingRule")} tag={t("docs.footerTag")} />
      </div>
    );
  }

  // =================================================================
  // PROFILE — M3. Service-book register: Employment, Qualifications,
  // Statutory & bank IDs (masked/reveal), Service Record (dated,
  // closes on current CTC).
  // =================================================================
  function ProfilePage() {
    const { c } = useTheme();
    const { t } = useT();

    const kvColumns = [
      { key: "field", label: t("profile.colField"), width: 220, align: "left" },
      { key: "value", label: t("profile.colValue"), flex: 2, align: "left" },
      { key: "action", label: t("profile.colAction"), width: 170, align: "right" },
    ];
    const noAction = <span style={{ fontFamily: Fonts.mono, fontSize: 11.5, color: c.inkFaint }}>—</span>;
    const requestChangeBtn = <Button variant="link" size="sm" onClick={() => {}}>{t("profile.requestChange")}</Button>;

    const employmentRows = [
      { key: "empid", cells: { field: t("profile.fieldEmployeeId"), value: EMPLOYEE.id, action: noAction } },
      { key: "cat", cells: { field: t("profile.fieldStaffCategory"), value: t("profile.valuePGT"), action: requestChangeBtn } },
      { key: "type", cells: { field: t("profile.fieldEmploymentType"), value: t("profile.valuePermanent"), action: requestChangeBtn } },
      { key: "doj", cells: { field: t("profile.fieldDOJ"), value: "01 Apr 2019", action: noAction } },
      { key: "conf", cells: { field: t("profile.fieldConfirmationDate"), value: "01 Oct 2019", action: noAction } },
      { key: "vac", cells: { field: t("profile.fieldVacationStaff"), value: t("profile.valueYes"), action: requestChangeBtn } },
      {
        key: "campus",
        cells: {
          field: t("profile.fieldReportingCampus"), value: t("profile.valueCampus"),
          action: <Mark tone="inkMuted" glyph="◌">{t("profile.changeRequested")}</Mark>,
        },
        flagged: true,
      },
      { key: "notice", cells: { field: t("profile.fieldNoticePeriod"), value: t("profile.valueNoticePeriod"), action: requestChangeBtn } },
      { key: "status", cells: { field: t("profile.fieldContractStatus"), value: <Mark status="Approved">{t("profile.valueActive")}</Mark>, action: noAction } },
    ];

    const qualColumns = [
      { key: "qual", label: t("profile.colQualification"), flex: 2, align: "left" },
      { key: "inst", label: t("profile.colInstitution"), flex: 1.6, align: "left" },
      { key: "year", label: t("profile.colYear"), width: 90, align: "right", mono: true },
      { key: "verify", label: t("profile.colVerification"), width: 170, align: "left" },
    ];
    const qualificationRows = [
      { key: "bed", cells: { qual: t("profile.qualBEd"), inst: t("profile.instRIE"), year: "2018", verify: <Seal label={t("docs.verified")} date="02 Jun 19" size={30} /> } },
      { key: "msc", cells: { qual: t("profile.qualMSc"), inst: t("profile.instDAVV"), year: "2016", verify: <Seal label={t("docs.verified")} date="02 Jun 19" size={30} /> } },
      {
        key: "ctet", cells: {
          qual: t("profile.qualCTET"), inst: t("profile.instCBSE"), year: "2019",
          verify: <Mark tone="seal" glyph="◍">{t("docs.expiringSoon")}</Mark>,
        }, tone: "seal",
      },
    ];

    const idRows = [
      { key: "pan", cells: { field: t("profile.fieldPAN"), value: <MaskedValue masked="XXXXX1234Z" full="AFZPS1234Z" size={12.5} />, action: requestChangeBtn } },
      { key: "aadhaar", cells: { field: t("profile.fieldAadhaar"), value: <MaskedValue masked="XXXX XXXX 4821" full="2418 6650 4821" size={12.5} />, action: requestChangeBtn } },
      { key: "uan", cells: { field: t("profile.fieldUAN"), value: <MaskedValue masked="1007XXXXXX45" full="100712345645" size={12.5} />, action: requestChangeBtn } },
      { key: "esic", cells: { field: t("profile.fieldESIC"), value: <span style={{ color: c.inkFaint }}>{t("profile.notApplicable")}</span>, action: noAction } },
      { key: "bankacc", cells: { field: t("profile.fieldBankAccount"), value: <MaskedValue masked="XXXXXXXX4821" full="50100123454821" size={12.5} />, action: requestChangeBtn } },
      { key: "ifsc", cells: { field: t("profile.fieldIFSC"), value: "HDFC0001234", action: requestChangeBtn } },
      { key: "branch", cells: { field: t("profile.fieldBankBranch"), value: t("profile.valueBankBranch"), action: requestChangeBtn } },
    ];

    const svcColumns = [
      { key: "event", label: t("profile.colEvent"), width: 130, align: "left" },
      { key: "date", label: t("profile.colEffectiveDate"), width: 130, align: "right", mono: true },
      { key: "details", label: t("profile.colDetails"), flex: 2, align: "left" },
      { key: "ctc", label: t("profile.colNewCTC"), width: 160, align: "right" },
    ];
    const noCtc = <span style={{ color: c.inkFaint }}>—</span>;
    const serviceRows = [
      { key: "joined", cells: { event: <Chip tone="success" size="sm" uppercase>{t("profile.eventJoined")}</Chip>, date: "01 Apr 2019", details: t("profile.detailJoined"), ctc: noCtc } },
      { key: "confirmed", cells: { event: <Chip tone="info" size="sm" uppercase>{t("profile.eventConfirmed")}</Chip>, date: "01 Oct 2019", details: t("profile.detailConfirmed"), ctc: noCtc } },
      { key: "promoted", cells: { event: <Chip tone="warning" size="sm" uppercase>{t("profile.eventPromoted")}</Chip>, date: "01 Apr 2022", details: t("profile.detailPromoted"), ctc: <Figure value={720000} size={12.5} /> } },
      { key: "revised24", cells: { event: <Chip tone="neutral" size="sm" uppercase>{t("profile.eventRevised")}</Chip>, date: "01 Apr 2024", details: t("profile.detailRevised24"), ctc: <Figure value={864000} size={12.5} /> } },
      { key: "revised25", cells: { event: <Chip tone="neutral" size="sm" uppercase>{t("profile.eventRevised")}</Chip>, date: "01 Apr 2025", details: t("profile.detailRevised25"), ctc: <Figure value={984000} size={12.5} /> } },
    ];

    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: c.bg }}>
        <ActionBar breadcrumbs={[t("nav.home"), t("profile.title")]}>
          <Button variant="ghost" size="sm">{t("profile.downloadServiceBook")}</Button>
        </ActionBar>
        <Masthead
          kicker={t("profile.kicker")}
          title={t("profile.title")}
          titleDeva={t("profile.titleDeva")}
          meta={`${EMPLOYEE.name} · ${EMPLOYEE.id} · ${EMPLOYEE.campus}`}
          right={<CountFigure kicker={t("profile.tenureKicker")} value="6y 4m" sub={t("profile.tenureSub")} />}
        />
        <div style={{ flex: 1, overflow: "auto" }}>
          <SectionTitle>{t("profile.sectionEmployment")}</SectionTitle>
          <Register
            columns={kvColumns} rows={employmentRows} rowHeight={40}
            totals={{ label: t("profile.totalFields"), labelSpan: 2, cells: { action: t("profile.totalPending") } }}
          />

          <SectionTitle>{t("profile.sectionQualifications")}</SectionTitle>
          <Register
            columns={qualColumns} rows={qualificationRows} rowHeight={44}
            totals={{ label: t("docs.totalsLabel"), labelSpan: 2, cells: { verify: "3" } }}
          />

          <SectionTitle>{t("profile.sectionStatutory")}</SectionTitle>
          <Register
            columns={kvColumns} rows={idRows} rowHeight={40}
            totals={{ label: t("docs.totalsLabel"), labelSpan: 2, cells: { action: "7" } }}
          />

          <SectionTitle>{t("profile.sectionService")}</SectionTitle>
          <Register
            columns={svcColumns} rows={serviceRows} rowHeight={44}
            totals={{
              label: t("profile.currentCTC"), labelSpan: 3,
              cells: { ctc: <Figure value={984000} size={17} weight={700} color={c.accent} /> },
            }}
          />
        </div>
        <StatusFooter rule={t("profile.governingRule")} tag={t("profile.footerTag")} />
      </div>
    );
  }

  // =================================================================
  // DocsProfile — convenience combo view (a top segmented switch over
  // the two standalone pages above). The production nav routes
  // nav.documents / nav.profile to window.Pages2.Documents / .Profile
  // directly; this export exists for a single-page preview of both.
  // =================================================================
  function DocsProfile() {
    const { c } = useTheme();
    const { t } = useT();
    const [tab, setTab] = useState("documents");
    const tabs = [
      { key: "documents", label: t("combo.documents") },
      { key: "profile", label: t("combo.profile") },
    ];
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ display: "flex", gap: G.sp[1], padding: `${G.sp[2]}px ${G.sp[5]}px`, borderBottom: `1px solid ${c.rule}`, background: c.bg, flex: "0 0 auto" }}>
          {tabs.map((tb) => {
            const active = tab === tb.key;
            return (
              <button
                key={tb.key} type="button" onClick={() => setTab(tb.key)}
                style={{
                  fontFamily: Fonts.sans, fontSize: 12.5, fontWeight: 600, padding: "6px 12px",
                  background: active ? c.sel : "transparent", color: active ? c.accent : c.inkMuted,
                  border: "none", borderBottom: `2px solid ${active ? c.accent : "transparent"}`, cursor: "pointer",
                }}
              >
                {tb.label}
              </button>
            );
          })}
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          {tab === "documents" ? <DocumentsPage /> : <ProfilePage />}
        </div>
      </div>
    );
  }

  window.Pages2 = window.Pages2 || {};
  window.Pages2.Documents = DocumentsPage;
  window.Pages2.Profile = ProfilePage;
  window.Pages2.DocsProfile = DocsProfile;
})();
