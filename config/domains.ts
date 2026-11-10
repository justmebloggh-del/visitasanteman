/** Directory sections that share one page layout (education, sports, transport). */
export interface DomainFact { label: string; column: string; format?: "tags" | "date" | "url" | "number" | "kind" }
export interface DomainCfg {
  key: string; table: string; base: string; title: string; intro: string; noun: string; emptyText: string;
  kindColumn?: string; kinds?: Record<string, string>;
  facts: DomainFact[];
  sections: { title: string; column: string }[];
  statusColumn?: "facility_status" | "visitor_access";
  crumbs?: { label: string; href?: string }[];
}

export const institutionKinds: Record<string, string> = {
  university: "University", technical_university: "Technical university", college_of_education: "College of education",
  nursing_midwifery: "Nursing and midwifery training", tvet: "TVET institution", senior_high: "Senior high school", library: "Library",
  research_institution: "Research institution", cultural_learning_centre: "Cultural learning centre", vocational: "Vocational training", other: "Other",
};
export const transportKinds: Record<string, string> = {
  airport: "Airport", intercity_bus: "Intercity bus", local_bus: "Local bus", terminal: "Transport terminal", taxi: "Taxi", ride_hailing: "Ride-hailing",
  car_rental: "Car rental", private_driver: "Private driver", tour_transport: "Tour transport", railway: "Railway", port: "Port and freight",
  walking_route: "Walking route", cycling_route: "Cycling route", accessible_transport: "Accessible transport", other: "Other",
};
export const facilityStatusLabels: Record<string, string> = {
  unknown: "Current operating status has not been confirmed",
  operational: "Operational",
  limited_service: "Limited service",
  under_development: "Under development: not yet an operating facility",
  proposed: "Proposed: not an existing facility",
  temporarily_closed: "Temporarily closed",
  permanently_closed: "Permanently closed",
};

export const educationCfg: DomainCfg = {
  key: "education", table: "institutions", base: "/education", title: "Education and learning", noun: "institution",
  intro: "Universities, colleges, schools, libraries and learning centres across Asanteman. A campus is not a tourist attraction unless the institution says visitors are welcome.",
  emptyText: "Institutions appear here once their names, recognition and details have been checked.",
  kindColumn: "kind", kinds: institutionKinds, statusColumn: "visitor_access",
  facts: [{ label: "Type", column: "kind", format: "kind" }, { label: "Facilities", column: "facilities", format: "tags" }, { label: "Admissions", column: "admissions_url", format: "url" }],
  sections: [{ title: "Programmes", column: "programmes" }, { title: "Recognition", column: "recognition_note" }, { title: "Visitors and open days", column: "visitor_arrangements" }],
};
export const sportsCfg: DomainCfg = {
  key: "sports", table: "sports_venues", base: "/sports", title: "Sports venues", noun: "venue",
  intro: "Stadiums, grounds and recreation facilities. Fixtures and results are not listed here: they change by season and need an authorised data source.",
  emptyText: "Venues appear here once their details have been checked.",
  statusColumn: "facility_status",
  facts: [{ label: "Sports", column: "sports", format: "tags" }, { label: "Capacity", column: "capacity", format: "number" }, { label: "Managed by", column: "managed_by" }, { label: "Facilities", column: "facilities", format: "tags" }],
  sections: [{title: "Booking and enquiries", column: "booking_info"}, { title: "Accessibility", column: "accessibility" }],
  crumbs: [{ label: "Sports", href: "/sports" }],
};
export const clubsCfg: DomainCfg = {
  key: "clubs", table: "sports_clubs", base: "/sports/clubs", title: "Sports clubs", noun: "club",
  intro: "Clubs based in Asanteman. Leagues and divisions change each season, so check the official competition source.",
  emptyText: "Clubs appear here once their details have been checked.",
  facts: [{ label: "Sport", column: "sport" }, { label: "Level (as stated by the source)", column: "level" }, { label: "Official site", column: "official_url", format: "url" }],
  sections: [],
  crumbs: [{ label: "Sports", href: "/sports" }, { label: "Clubs", href: "/sports/clubs" }],
};
export const transportCfg: DomainCfg = {
  key: "transport", table: "transport_providers", base: "/transport", title: "Transport and getting around", noun: "service",
  intro: "Airports, buses, taxis, car rental, rail and other ways to travel around Asanteman. Each entry says whether it is operating. Fares and times appear only when confirmed.",
  emptyText: "Transport services appear here once their details have been checked.",
  kindColumn: "kind", kinds: transportKinds, statusColumn: "facility_status",
  facts: [{ label: "Type", column: "kind", format: "kind" }, { label: "Departure points", column: "departure_points" }, { label: "Operating days and times", column: "operating_info" }, { label: "Fares", column: "fare_info" }, { label: "Fare information last updated", column: "fare_updated_at", format: "date" }, { label: "Booking", column: "booking_method" }, { label: "Booking link", column: "booking_url", format: "url" }],
  sections: [{ title: "Routes", column: "routes" }, { title: "Luggage", column: "luggage_rules" }, { title: "Accessibility", column: "accessibility" }],
};
export const domainCfgs = [educationCfg, sportsCfg, clubsCfg, transportCfg];
