/**
 * Plain-language legal pages. They describe only what this website does today (checked against the code on 17 November 2026):
 * the cookies it sets, the forms it has, the services it uses. They name no company number, address or fixed retention period,
 * because none has been confirmed. They are a DRAFT: a Ghanaian lawyer must review them (including against the Data Protection
 * Act, 2012, Act 843) before the site relies on them. An administrator can replace any of them by writing a body for the page in
 * Admin, Pages; that text then takes the place of these.
 */
export interface LegalSection { id: string; title: string; paragraphs?: string[]; items?: string[] }
export interface LegalDoc { updated: string; intro: string; sections: LegalSection[] }

const UPDATED = "17 November 2026";
const CONTACT = "Use the contact form on this website to reach us.";

export const cookiePolicy: LegalDoc = {
  updated: UPDATED,
  intro: "This page explains which cookies and similar technologies VisitAsanteman uses, what each is for, and how you can change your mind at any time.",
  sections: [
    { id: "what", title: "What cookies are", paragraphs: ["A cookie is a small text file that a website stores in your browser. Some are needed for the site to work. Others are optional, and we ask before we use them."] },
    { id: "necessary", title: "Necessary cookies (always on)", paragraphs: ["These keep the site working and cannot be switched off here. They do not track you across other websites."],
      items: [
        "Sign-in session cookies, set by our authentication service when you log in, so that you stay signed in and we can tell who is asking for a private page.",
        "A consent record (vasa_consent), which remembers the choices you make in the cookie banner. We ask again after 12 months.",
      ] },
    { id: "optional", title: "Optional cookies (off until you agree)", paragraphs: ["When you first visit, the banner lets you accept all, reject all, or choose by category. Nothing optional is loaded until you agree."],
      items: [
        "Functional: remembers optional preferences. This site does not currently set any.",
        "Analytics: Google Analytics, which helps us count visits and see which pages are useful. It is loaded only if it is switched on for this site and you have agreed to Analytics. If you later withdraw consent, it is switched off and its cookies are removed.",
        "Advertising: third-party advertising or tracking. This site does not currently use any. Sponsored placements are shown by us and are always labelled as such.",
      ] },
    { id: "maps", title: "Maps and other services", paragraphs: ["Our maps load their tiles from OpenStreetMap. When a map is shown, your browser contacts that service, which can see your IP address and basic browser details. We do not set any cookie for this."] },
    { id: "change", title: "Changing your choice", items: [
      "Choose “Cookie settings” in the footer of any page to open the banner again and change your choices.",
      "You can also delete or block cookies in your browser settings. If you block necessary cookies, you will not be able to sign in.",
    ] },
    { id: "law", title: "The law we follow", paragraphs: ["We aim to follow Ghana's Data Protection Act, 2012 (Act 843). See our Privacy policy for how we handle personal information more widely."] },
    { id: "contact", title: "Questions", paragraphs: [CONTACT] },
  ],
};

export const privacyPolicy: LegalDoc = {
  updated: UPDATED,
  intro: "This policy explains what personal information VisitAsanteman collects, why, who helps us handle it, and the choices you have. We have tried to keep it short and plain.",
  sections: [
    { id: "who", title: "Who we are", paragraphs: ["VisitAsanteman is a tourism, heritage, business and jobs website for Asanteman in Ghana. In this policy, “we” means VisitAsanteman, the operator of this website."] },
    { id: "collect", title: "What we collect, and when", paragraphs: ["We only collect what a feature needs. You can browse most of the site without giving us any personal information."],
      items: [
        "Your account: your email address, your name and your password (stored in scrambled form by our authentication service) when you register.",
        "Contact, enquiry and partnership forms: your name, email address, phone number if you give one, and your message.",
        "Newsletter: your email address.",
        "Event registration: your name, email address, phone number and the number of guests.",
        "Award nominations: the nominee's name, organisation, location, the reason for the nomination and any link you add, plus your own name, email address and phone number as the nominator.",
        "Job applications: your name, phone number, a cover note and your CV. CVs are kept private and are available only to the employer and to staff who need to review them.",
        "Bookings and payments: the details you give for a booking. Card or mobile-money details are entered with our payment provider, Paystack, and are not stored by us. Online payment is not switched on until it has been fully tested.",
        "Business listings, reviews and travel plans you create while signed in.",
        "Technical information: your IP address is used briefly to slow down repeated or abusive requests. It is held in the server's memory for a short time and is not written to our database. Our hosting provider may also keep standard server logs.",
        "Analytics: only if you agree in the cookie banner (see the Cookie policy).",
      ] },
    { id: "use", title: "How we use it", items: [
      "To provide the feature you asked for, such as sending your registration, replying to your message or passing your application to the employer.",
      "To keep the site secure and prevent misuse.",
      "To send our newsletter, only to people who signed up for it. To stop receiving it, ask us through the contact form and we will remove your address.",
      "To understand which pages are useful, when you have agreed to analytics.",
    ] },
    { id: "share", title: "Who else handles it", paragraphs: ["We use trusted services to run the site. They handle information only to provide their service to us:"],
      items: [
        "Supabase: our database, sign-in service and file storage.",
        "Vercel: website hosting.",
        "Resend: sending emails from the site, when it is switched on.",
        "Paystack: card and mobile-money payments, when it is switched on.",
        "Google Analytics: visit statistics, only with your consent.",
        "OpenStreetMap: map tiles (see the Cookie policy).",
        "Anthropic: if the optional itinerary assistant is switched on, the question you type is sent to it to produce an answer. Do not put personal details in that box.",
      ] },
    { id: "sell", title: "What we do not do", paragraphs: ["We do not sell your personal information. Employers and businesses see only what a feature is designed to show them, for example an application sent to that employer."] },
    { id: "transfers", title: "Where it is processed", paragraphs: ["Some of the services above may process information outside Ghana. We choose services that protect it, and we will say more here once their locations are confirmed."] },
    { id: "keep", title: "How long we keep it", paragraphs: ["We keep personal information only as long as we need it for the reason you gave it to us, and then delete it or make it anonymous. We have not yet set fixed periods for each kind of information, and we will publish them here when we do."] },
    { id: "rights", title: "Your rights", paragraphs: ["Under Ghana's Data Protection Act, 2012 (Act 843) you can ask what personal information we hold about you, ask us to correct it, ask us to delete it, and object to certain uses. You can also withdraw your cookie consent at any time through “Cookie settings” in the footer."],
      items: ["To make a request, " + CONTACT.charAt(0).toLowerCase() + CONTACT.slice(1) + " We may need to confirm who you are before we act on it.", "If you are not satisfied with how we handle your information, you have the right to complain to Ghana's Data Protection Commission."] },
    { id: "security", title: "Keeping information safe", paragraphs: ["Access to personal information is limited by permissions in the database and checked again on the server, and private files such as CVs are kept private. No website can promise perfect security, so please use a strong, unique password."] },
    { id: "changes", title: "Changes to this policy", paragraphs: ["If we change this policy we will update the date at the top. This is a draft policy that is awaiting legal review."] },
    { id: "contact", title: "Questions", paragraphs: [CONTACT] },
  ],
};

export const termsAndConditions: LegalDoc = {
  updated: UPDATED,
  intro: "These terms explain how you may use the VisitAsanteman website. By using the site you agree to them. If you do not agree, please do not use it.",
  sections: [
    { id: "about", title: "About the site", paragraphs: ["VisitAsanteman is a guide to tourism, heritage, businesses, events and jobs in Asanteman, Ghana. We aim to keep information accurate, and we say where it comes from and when it was checked. Some pages are still being prepared, and some information comes from public sources that custodians or official bodies have not yet reviewed."] },
    { id: "information", title: "Information on the site", items: [
      "Opening times, prices, dates, directions and entry rules can change. Please confirm them with the place or organiser before you travel.",
      "Cultural and traditional content is shared with respect for the institutions that own it, and is checked with the appropriate custodians before it is marked as verified.",
      "Listings are provided by businesses and reviewed before publication. A listing is not an endorsement, and being listed or advertising does not make a business verified.",
    ] },
    { id: "accounts", title: "Accounts", items: [
      "Give accurate information and keep your password private. You are responsible for what happens under your account.",
      "Staff, business, employer and ordinary accounts have different permissions. Do not try to reach pages or data you are not allowed to see.",
    ] },
    { id: "use", title: "Using the site properly", paragraphs: ["Please do not:"], items: [
      "post anything unlawful, abusive, misleading or that infringes someone else's rights;",
      "submit false reviews, vacancies, nominations or registrations;",
      "try to break, overload or gain unauthorised access to the site, or collect its content by automated means in a way that harms it;",
      "use the site to send unsolicited advertising.",
    ], },
    { id: "bookings", title: "Bookings, registrations and payments", paragraphs: ["A booking or registration is an arrangement between you and the business or organiser, who set their own conditions. Payments, when switched on, are handled by our payment provider, Paystack, and a booking is confirmed only when its status on the site says so. Free event registration is subject to the capacity the organiser sets."] },
    { id: "jobs", title: "Jobs and applications", paragraphs: ["Applying for a job through the site is free. Employers are responsible for their vacancies and for how they treat applications. If you see a vacancy you think is suspicious, use the report option."] },
    { id: "awards", title: "Awards", paragraphs: ["Nominations are free to make. Programmes publish their own rules, and shortlisting and winners are decided under those rules and the governance steps recorded on the site."] },
    { id: "content", title: "Our content and yours", items: [
      "The site's design, text and original material belong to VisitAsanteman or are used with permission. Photographs and artwork keep the rights of their owners. You may share links and short quotations with credit, but please do not copy the site wholesale.",
      "If you send us content, such as a review, a photograph or a nomination, you confirm you are allowed to share it and you let us display it on the site for the purpose you sent it.",
    ] },
    { id: "links", title: "Other websites", paragraphs: ["We link to other websites and cannot control or accept responsibility for their content or practices."] },
    { id: "liability", title: "Our responsibility", paragraphs: ["We provide the site on an “as is” basis and cannot promise that it will always be available or free of errors. To the extent the law allows, we are not responsible for loss caused by relying on information on the site, by services provided by other businesses, or by interruptions. Nothing in these terms limits any right you have under the law that cannot be limited."] },
    { id: "law", title: "Governing law", paragraphs: ["These terms are governed by the laws of Ghana."] },
    { id: "changes", title: "Changes", paragraphs: ["We may update these terms from time to time and will change the date at the top when we do. Continued use of the site means you accept the updated terms. These terms are a draft that is awaiting legal review."] },
    { id: "contact", title: "Questions", paragraphs: [CONTACT] },
  ],
};

export const ourMission = {
  mission: "To connect Asanteman with the world through tourism, heritage preservation, digital innovation, cultural exchange, education, business development, youth empowerment and international engagement.",
  vision: "To become a leading global gateway for discovering, experiencing, preserving and promoting Asanteman's heritage, tourism, culture, opportunities and people.",
  aims: [
    ["Show the whole region", "district by district, not only Kumasi."],
    ["Share heritage accurately", "working with custodians and traditional authorities for cultural content."],
    ["Back local businesses", "giving them a free, honest place to be found."],
    ["Keep information trustworthy", "with sources and review dates on practical pages."],
    ["Open up work", "with a jobs board that does not charge applicants."],
    ["Welcome the world", "including the African diaspora, with a secure, fast, accessible and mobile-friendly experience."],
  ] as [string, string][],
};
