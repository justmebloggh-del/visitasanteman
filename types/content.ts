export interface MediaRef {
  path: string;
  alt_text: string;
}

interface Seo {
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  noindex: boolean;
}

interface Cover {
  cover: MediaRef | null;
}

export interface Community extends Seo, Cover {
  id: string; slug: string; name: string; summary: string | null; history: string | null;
  cultural_heritage: string | null; traditional_leadership: string | null; festivals: string | null;
  traditional_food: string | null; directions: string | null; latitude: number | null; longitude: number | null;
  sources: string | null; content_verified: boolean;
}

export interface Attraction extends Seo, Cover {
  id: string; slug: string; name: string; summary: string | null; description: string | null;
  history: string | null; video_url: string | null; latitude: number | null; longitude: number | null;
  directions: string | null; opening_hours: string | null; entrance_fee: string | null; activities: string[];
  visitor_guidelines: string | null; accessibility: string | null; contact_phone: string | null;
  contact_email: string | null; is_featured: boolean; community_id: string | null;
  access_status: string; access_notes: string | null; managing_institution: string | null; alt_names: string[];
  source_organisation: string | null; source_url: string | null; source_published_at: string | null; researched_at: string | null;
  sources: string | null; content_verified: boolean;
  category: { name: string; slug: string } | null;
  community: { name: string; slug: string } | null;
}

export interface Listing extends Seo, Cover {
  id: string; slug: string; type: string; name: string; summary: string | null; description: string | null;
  address: string | null; directions: string | null; latitude: number | null; longitude: number | null;
  phone: string | null; whatsapp: string | null; email: string | null; website: string | null;
  social: Record<string, string>; opening_hours: string | null; price_from: number | null;
  price_currency: string; price_note: string | null; amenities: string[]; cuisines: string[];
  is_featured: boolean; is_verified: boolean; community_id: string | null;
  community: { name: string; slug: string } | null;
}

export interface RoomType {
  id: string; name: string; description: string | null; max_guests: number | null;
  price_per_night: number | null;
}

export interface MenuItem {
  id: string; section: string; name: string; description: string | null; price: number | null;
}

export interface Experience extends Seo, Cover {
  id: string; slug: string; title: string; category: string; summary: string | null;
  description: string | null; duration_minutes: number | null; price_from: number | null;
  price_currency: string; price_unit: string | null; min_participants: number | null;
  max_participants: number | null; meeting_point: string | null; latitude: number | null;
  longitude: number | null; safety_requirements: string | null; cancellation_policy: string | null;
  video_url: string | null; provider_verified: boolean; is_featured: boolean;
  provider: { name: string; slug: string; phone: string | null; whatsapp: string | null; email: string | null } | null;
}

export interface EventItem extends Seo, Cover {
  id: string; slug: string; title: string; summary: string | null; description: string | null;
  starts_at: string; ends_at: string | null; venue: string | null; organiser: string | null;
  ticket_info: string | null; registration_url: string | null; contact_email: string | null;
  contact_phone: string | null; event_status: string; latitude: number | null; longitude: number | null;
}

export interface Article extends Seo, Cover {
  id: string; slug: string; title: string; excerpt: string | null; body: string; tags: string[];
  published_at: string | null; category: { name: string; slug: string } | null;
}

export interface PageContent extends Seo {
  slug: string; title: string; body: string; cover: MediaRef | null;
}

export interface HomepageSection {
  key: string; title: string | null; subtitle: string | null; body: string | null; is_enabled: boolean;
  config: Record<string, unknown>;
}

export interface Testimonial {
  id: string; author_name: string; author_origin: string | null; quote: string; rating: number | null;
}

export interface MapPoint {
  id: string; kind: "attraction" | "community" | "accommodation" | "restaurant" | "business" | "event" | "experience";
  title: string; href: string; lat: number; lng: number;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageCount: number;
}
