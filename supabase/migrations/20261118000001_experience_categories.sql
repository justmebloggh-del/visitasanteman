-- VisitAsanteman Phase 6: more experience categories. Own file: new enum values cannot be used in the same transaction.
alter type experience_category add value if not exists 'heritage_tour';
alter type experience_category add value if not exists 'craft_workshop';
alter type experience_category add value if not exists 'food_experience';
alter type experience_category add value if not exists 'city_tour';
alter type experience_category add value if not exists 'festival_experience';
alter type experience_category add value if not exists 'farm_visit';
alter type experience_category add value if not exists 'educational_excursion';
alter type experience_category add value if not exists 'wildlife_viewing';
alter type experience_category add value if not exists 'waterfall_visit';
