-- VisitAsanteman Phase 7: more advertising placements. Own file: new enum values cannot be used in the same transaction.
alter type ad_placement add value if not exists 'search_top';
alter type ad_placement add value if not exists 'culture_top';
alter type ad_placement add value if not exists 'district_top';
