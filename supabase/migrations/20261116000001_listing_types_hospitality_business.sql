-- VisitAsanteman Phase 4: more hospitality and business listing types.
-- Own file: new enum values cannot be used in the transaction that adds them.
alter type listing_type add value if not exists 'boutique_hotel';
alter type listing_type add value if not exists 'homestay';
alter type listing_type add value if not exists 'conference_centre';
alter type listing_type add value if not exists 'event_venue';
alter type listing_type add value if not exists 'wedding_venue';
alter type listing_type add value if not exists 'cafe';
alter type listing_type add value if not exists 'bakery';
alter type listing_type add value if not exists 'food_vendor';
alter type listing_type add value if not exists 'caterer';
alter type listing_type add value if not exists 'market';
alter type listing_type add value if not exists 'shopping_centre';
alter type listing_type add value if not exists 'craft_producer';
alter type listing_type add value if not exists 'jeweller';
alter type listing_type add value if not exists 'manufacturer';
alter type listing_type add value if not exists 'agribusiness';
alter type listing_type add value if not exists 'food_producer';
alter type listing_type add value if not exists 'professional_services';
