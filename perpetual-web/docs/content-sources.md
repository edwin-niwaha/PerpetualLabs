# Company content reference

Reviewed on 25 September 2026. The user requested content adaptation from the existing Perpetual Labs site, while retaining this project's independent design.

## Sources and editorial decisions

- [Home](https://perpetual-web-vert.vercel.app/): business positioning and brief, verbatim client-feedback excerpts. No imported design, stock photography, performance metrics, or unverified certifications.
- [About](https://perpetual-web-vert.vercel.app/about): Kampala location, founding year 2020, mission, vision, values, and the five published team names/roles.
- [Services](https://perpetual-web-vert.vercel.app/services): seven service areas and their published capabilities, rewritten for clarity.
- [Projects](https://perpetual-web-vert.vercel.app/projects): PureShopper, DonorLink, StockTrack, FinCore, CoreHR, and SchoolSync. Summaries describe listed capabilities; they do not invent technologies, results, client assignments, or live-product links.
- [Contact](https://perpetual-web-vert.vercel.app/contact): Kampala, Uganda; +256 703 163 074; hello.perpetuallabs@gmail.com; published WhatsApp link.

Some source project detail pages currently display “Project Not Found”. Local overview pages therefore use the verified project listing content. CoreHR and SchoolSync source dates predate the stated company founding year, so those dates are intentionally omitted pending confirmation. Other dates are reproduced from the listing.

Project covers are original typographic artwork, not product screenshots. Team cards use initials, not unrelated stock portraits. Testimonials are short excerpts with the names, roles, and organizations stated by the source; the ellipsis denotes an excerpt.

## Content behavior

The reviewed records live in src/lib/company-content.ts. A nonempty Django collection takes precedence in full. When a collection is empty or cannot be loaded, the site uses the reviewed reference records for services, projects, team, and testimonials. Blog posts still come only from Django.

This ships useful company content with the code without writing to a production database or depending on the reference website at runtime. To retire these reference records permanently, edit the versioned content file. To manage content through Django, publish the replacement collection there.

Authentication, account updates, and contact submissions always use the real API. They never fall back to a simulated success.

## Updated product catalog and homepage imagery

The previous six bundled projects have been retired from the frontend. The owner requested four database-managed products: PendezaConnect (replaces DonorLink), JobellStores, DuukaYo, and FinCore. PendezaConnect content was checked at https://sponsorwithpendeza.org/ and JobellStores at https://jobellinc.com/. DuukaYo is not hosted; its storefront/POS/mobile capabilities were verified in the README at https://github.com/edwin-niwaha/DuukaYo. FinCore uses the previous reviewed financial-management description, with no invented live link or completion date.

`seed_website` installs catalog rows and media into Django. Product publication and featured status are authoritative; empty product collections do not resurrect bundled records. The earlier reference fallback policy now applies only to services, team, and testimonials. See `perpetual-api/content-assets/README.md` for image sources and credits.
