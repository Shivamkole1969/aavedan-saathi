// Upload presets. Every number comes from the official notice named in `sources` (re-checked 19 Nov 2026; first checked 12 Nov 2026).
// Add a preset only after reading its official PDF; never from a blog.
(function () {
  var IBPS_SBI = [
    { t: 'IBPS CRP PO/MT-XVI, Detailed Notification (2026), printed pp. 36-38', url: 'https://www.ibps.in/wp-content/uploads/Detailed-Notification_CRP-PO-XVI_Final_V1_30.06.2026.pdf' },
    { t: 'IBPS CRP CSA-XVI (Clerk), Notification (2026), printed pp. 52-54', url: 'https://www.ibps.in/wp-content/uploads/Notification_CRP_CSA_XVI-Final.pdf' },
    { t: 'SBI PO, Advt. CRPD/PO/2026-27/09, Annexure II', url: 'https://sbi.co.in/documents/77530/57941334/18062026_1_Detailed_Adv.2026.pdf' },
    { t: 'SBI Junior Associate (Clerk) 2026, Advt. CRPD/CR/2026-27/17, upload instructions', url: 'https://sbi.bank.in/webfiles/uploads/files_2627/08/JA_2026_Detailed_Advt_Eng.pdf' }
  ];
  var SSC_BASE = 'https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/';
  var SSC = [
    { t: 'SSC CGL 2026, notice F. No. HQ-C11018/1/2026-C-1 (21.05.2026), para 9.6', url: SSC_BASE + 'Notice_of_adv_cgl_2026.pdf' },
    { t: 'SSC CHSL 2026, notice F. No. HQ-C1102/5/2026-C-1 (07.09.2026), para 9.6', url: SSC_BASE + 'Notice_of_adv_chsle_2026.pdf' },
    { t: 'SSC GD Constable 2026, notice F. No. HQ-C-3007/10/2025-C-3 (01.12.2025), para 8.7', url: SSC_BASE + 'Notice_of_CTGD_2026.pdf' },
    { t: 'SSC MTS 2025, notice F. No. E/15/2025-C-2 (26.06.2025), para 10', url: SSC_BASE + 'Notice_of_adv_mts_2025.pdf' }
  ];
  var UPSC = [
    { t: 'UPSC IES/ISS 2026, Notice No. 07/2026 (11.02.2026), p. 26', url: 'https://www.upsc.gov.in/sites/default/files/Exam_Notification_IES_ISS_Eng_11022026.pdf' },
    { t: 'UPSC CAPF (AC) 2026, Notice No. 08/2026 (20.02.2026), p. 15', url: 'https://www.upsc.gov.in/sites/default/files/ExamNotifi_CAPF_AC_Exam_2026_Eng_20022026.pdf' },
    { t: 'UPSC ESE 2027, Notice No. 02/2027-ENGG (16.09.2026), instruction 4: photo and signature 20-300 KB each', url: 'https://www.upsc.gov.in/sites/default/files/Notif-ESEP-2027-Engl-160926.pdf' }
  ];
  var UPSC_SIGN = UPSC.concat([{ t: 'UPSC CSE 2026, Notice No. 05/2026-CSE (04.02.2026), p. 2', url: 'https://www.upsc.gov.in/sites/default/files/Notif-CSP-2026-Engl-060226Rev.pdf' }]);
  var G_IBPS = { hi: 'IBPS PO/क्लर्क 2026 · SBI PO 2026-27 · SBI क्लर्क 2026', en: 'IBPS PO/Clerk 2026 · SBI PO 2026-27 · SBI Clerk 2026' };
  var G_SSC = { hi: 'SSC CGL/CHSL 2026 · GD 2026 · MTS 2025', en: 'SSC CGL/CHSL 2026 · GD 2026 · MTS 2025' };
  var G_UPSC = { hi: 'UPSC (2026 और ESE 2027 की अधिसूचनाएँ)', en: 'UPSC (2026 and ESE 2027 notices)' };
  var G_OWN = { hi: 'अपना साइज़', en: 'Your own size' };
  var SSC_PHOTO = {
    hi: 'SSC में फोटो अपलोड नहीं होती: फॉर्म भरते समय वेबकैम या mySSC ऐप से लाइव फोटो ली जाती है (CGL 2026, पैरा 9.4-9.5)। अच्छी रोशनी, सादा बैकग्राउंड; पैरा 9.5(v): टोपी, मास्क या चश्मा नहीं।',
    en: 'SSC does not take an uploaded photo: a live photo is captured by webcam or the mySSC app while you fill the form (CGL 2026, paras 9.4-9.5). Good light, plain background; para 9.5(v): no cap, mask or glasses.'
  };
  window.AS_PRESETS = [
    { id: 'ibps-photo', group: G_IBPS, label: { hi: 'फोटो: 200×230 px, 20-50 KB', en: 'Photo: 200×230 px, 20-50 KB' },
      w: 200, h: 230, minKB: 20, maxKB: 50, clean: false, sources: IBPS_SBI,
      notes: { hi: 'रंगीन फोटो, हल्का या सफ़ेद बैकग्राउंड, टोपी या काला चश्मा नहीं। IBPS और SBI फॉर्म में लाइव फोटो भी लेते हैं।', en: 'Colour photo, light or white background, no cap or dark glasses. IBPS and SBI also capture a live photo in the form.' } },
    { id: 'ibps-sign', group: G_IBPS, label: { hi: 'हस्ताक्षर: 140×60 px, 10-20 KB', en: 'Signature: 140×60 px, 10-20 KB' },
      w: 140, h: 60, minKB: 10, maxKB: 20, clean: true, sources: IBPS_SBI,
      notes: { hi: 'सफ़ेद कागज़ पर काली स्याही से। कैपिटल (बड़े) अक्षरों में हस्ताक्षर स्वीकार नहीं।', en: 'Black ink on white paper. A signature in CAPITAL letters is not accepted.' } },
    { id: 'ibps-thumb', group: G_IBPS, label: { hi: 'बाएँ अंगूठे का निशान: 240×240 px, 20-50 KB', en: 'Left thumb impression: 240×240 px, 20-50 KB' },
      w: 240, h: 240, dpi: 200, minKB: 20, maxKB: 50, clean: true, sources: IBPS_SBI,
      notes: { hi: 'सफ़ेद कागज़ पर काली या नीली स्याही। 200 DPI (3×3 cm)।', en: 'Black or blue ink on white paper. 200 DPI (3×3 cm).' } },
    { id: 'ibps-decl', group: G_IBPS, label: { hi: 'हस्तलिखित घोषणा: 800×400 px, 50-100 KB', en: 'Handwritten declaration: 800×400 px, 50-100 KB' },
      w: 800, h: 400, dpi: 200, minKB: 50, maxKB: 100, clean: true, sources: IBPS_SBI, decl: true,
      notes: { hi: 'सफ़ेद कागज़ पर काली स्याही, केवल अंग्रेज़ी में, कैपिटल अक्षरों में नहीं। 200 DPI (10×5 cm)।', en: 'Black ink on white paper, English only, not in capital letters. 200 DPI (10×5 cm).' } },
    { id: 'ssc-sign', group: G_SSC, label: { hi: 'हस्ताक्षर: लगभग 6.0×2.0 cm, 10-20 KB', en: 'Signature: about 6.0×2.0 cm, 10-20 KB' },
      w: 709, h: 236, dpi: 300, minKB: 10, maxKB: 20, clean: true, sources: SSC,
      notes: { hi: 'JPEG, 10-20 KB। 6.0×2.0 cm को 300 DPI पर 709×236 px बनाया गया है (300 DPI केवल GD 2026 नोटिस में लिखा है; यहाँ इसे cm से पिक्सेल निकालने के लिए लिया है)। ध्यान दें: CGL/CHSL नोटिस के एक हिस्से में 4.0×2.0 cm भी लिखा है, उसके लिए अगला विकल्प चुनें।', en: 'JPEG, 10-20 KB. 6.0×2.0 cm is 709×236 px at 300 DPI (only the GD 2026 notice states 300 DPI; here it is used to turn cm into pixels). Note: one section of the CGL/CHSL notice says 4.0×2.0 cm instead; use the next option for that.' },
      extra: SSC_PHOTO },
    { id: 'ssc-sign-4', group: G_SSC, label: { hi: 'हस्ताक्षर: 4.0×2.0 cm वाला रूप, 10-20 KB', en: 'Signature: the 4.0×2.0 cm version, 10-20 KB' },
      w: 472, h: 236, dpi: 300, minKB: 10, maxKB: 20, clean: true, sources: SSC,
      notes: { hi: 'CGL/CHSL 2026 नोटिस के अपलोड-निर्देशों में 4.0×2.0 cm लिखा है (पैरा 9.6 में 6.0×2.0 cm)। जो आपका फॉर्म माँगे, वही चुनें। 472×236 px = 4.0×2.0 cm, 300 DPI पर।', en: 'The upload steps in the CGL/CHSL 2026 notices say 4.0×2.0 cm (para 9.6 says 6.0×2.0 cm). Use whichever your form asks for. 472×236 px = 4.0×2.0 cm at 300 DPI.' },
      extra: SSC_PHOTO },
    { id: 'upsc-photo', group: G_UPSC, label: { hi: 'फोटो: .jpg, 20-200 KB', en: 'Photo: .jpg, 20-200 KB' },
      minKB: 20, maxKB: 200, clean: false, sources: UPSC,
      notes: { hi: 'इन दो 2026 नोटिस से केवल KB सीमा ली गई है; पिक्सेल साइज़ हमने यहाँ नहीं जाँचा। CSE, NDA, CDS के लिए अपनी अधिसूचना ज़रूर देखें। UPSC ESE 2027 नोटिस (16.09.2026) में फोटो और हस्ताक्षर दोनों 20-300 KB हैं; यहाँ बनी 20-200 KB फ़ाइल उस सीमा में भी आती है।', en: 'Only the KB range is taken from these two 2026 notices; the pixel size was not checked here. For CSE, NDA or CDS, check your own notice. The UPSC ESE 2027 notice (16.09.2026) allows 20-300 KB for both photo and signature; a file made here at 20-200 KB also fits that range.' } },
    { id: 'upsc-sign', group: G_UPSC, label: { hi: 'हस्ताक्षर: .jpg, 20-100 KB', en: 'Signature: .jpg, 20-100 KB' },
      minKB: 20, maxKB: 100, clean: true, sources: UPSC_SIGN,
      notes: { hi: 'CSE 2026 नोटिस: सफ़ेद कागज़ पर काली स्याही से तीन बार, एक के नीचे एक हस्ताक्षर। ESE 2027 नोटिस में 20-300 KB है; यहाँ बनी 20-100 KB फ़ाइल उसमें भी आती है।', en: 'CSE 2026 notice: sign three times, one below the other, in black ink on white paper. The ESE 2027 notice allows 20-300 KB; a file made here at 20-100 KB also fits.' } },
    { id: 'custom', group: G_OWN, label: { hi: 'अपना साइज़ और KB डालें', en: 'Enter your own size and KB' }, custom: true, clean: false, sources: [] }
  ];
  window.AS_DECL = 'I, ________ (Name of the candidate), hereby declare that all the information submitted by me in the application form is correct, true and valid. I will present the supporting documents as and when required.';
})();
