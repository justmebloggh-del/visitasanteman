# Mobile audit (17 November 2026)

Method: an automated browser audit of 60 public routes at 390 px (phone, touch, 2x), repeated for 14 key routes at 320, 360, 375,
414, 430, 768, 1024 and 1440 px, plus real taps on the menu, a form and the slideshow. Run against the local site. Lighthouse
was run once against the live site (before these changes). The Playwright end-to-end suite, a real-phone test and a Lighthouse run
on the new build were not done.

## Found
| # | Problem | Evidence |
|---|---|---|
| 1 | Navigation bar and banner joined as one green block | 0 px gap, same kente cloth |
| 2 | Banner too tall | 364 px (header 77 px): over half of an 844 px screen |
| 3 | Homepage film downloaded on phones | 9.4 MB page; live Lighthouse: performance 38, LCP 9.7 s, 9.9 MB |
| 4 | Map code loaded immediately | live total blocking time 2.7 s |
| 5 | Form fields at 14 px | iPhones zoom the page when a field is tapped |
| 6 | Small tap targets | 2,674 elements under 40 px on the 60 pages (footer links 17 px, pills 32 to 38 px, slideshow dots 8 px, map buttons 29 px, breadcrumbs 17 px) |
| 7 | Very tall pages | /districts 23,635 px, /attractions 14,022 px: cards without a photograph showed a large empty picture block |
| 8 | Built-in photographs served at full size, not optimised | unoptimised originals |
| 9 | Footer logo loaded as high priority | one eager image below the fold on every page |

Not found: horizontal overflow (none on any page or width), text under 12 px, images without alt text, console errors, over-sized images.

## Done
1. Header 57 px (was 77), gold rule under it, 8 px gap before the banner; banner heights 180 px (under 360), 196 px (360 to 389), 204 px (390 to 430), 228 px (431 to 639); unchanged from 640 px.
2. Homepage hero: about 360 to 460 px on phones (was 716); the film loads only on 768 px and wider, with motion allowed, no Data Saver and not 2G. Phones see the hero photograph.
3. Map code loads only when the map nears the screen; map 340 px tall on phones.
4. Form fields 16 px on phones. Pills, chips, footer links, breadcrumb links, "more" links, sign-in links, small buttons and menu links are at least 44 px tall. Slideshow shows "n / 15" and 44 px buttons on phones. Map buttons 44 px.
5. Cards with no photograph drop the empty picture block on phones (/districts 23,635 to 12,195 px; /communities 10,747 to 5,612 px; /attractions 14,022 to 9,233 px).
6. Built-in photographs now go through the image optimiser (modern format, phone-sized, quality 90, never enlarged).
7. Footer logo no longer high priority.

## Result at 390 px (60 routes)
No overflow; banner 220 px on every page; gap 8 px; homepage 1.8 MB (was 9.4 MB); no errors; largest contentful paint under 1.7 s locally.

## Left
- Banner words are cut after two lines on phones (one line under 390 px).
- Map attribution links (legally required) are small.
- /districts is still long (43 entries) until districts are activated.
- Lighthouse on the new build, real-device testing and the end-to-end suite.
