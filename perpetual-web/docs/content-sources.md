# Company content reference

Reviewed on 25 September 2026. The user requested content adaptation from the existing Perpetual Labs site, while retaining this project's independent design.

## Sources and editorial decisions

- [Home](https://perpetual-web-vert.vercel.app/): business positioning and brief, verbatim client-feedback excerpts. No imported design, stock photography, performance metrics, or unverified certifications.
- [About](https://perpetual-web-vert.vercel.app/about): Kampala location, founding year 2020, mission, vision, values, and the five published team names/roles.
- [Services](https://perpetual-web-vert.vercel.app/services): seven service areas and their published capabilities, rewritten for clarity.
- [Projects](https://perpetual-web-vert.vercel.app/projects): PureShopper, DonorLink, StockTrack, FinCore, CoreHR, and SchoolSync. Summaries describe listed capabilities; they do not invent technologies, results, client assignments, or live-product links.
- [Contact](https://perpetual-web-vert.vercel.app/contact): Kampala, Uganda; +256 703 163 074; perpetual.ict@gmail.com; published WhatsApp link.

Some source project detail pages currently display “Project Not Found”. Local overview pages therefore use the verified project listing content. CoreHR and SchoolSync source dates predate the stated company founding year, so those dates are intentionally omitted pending confirmation. Other dates are reproduced from the listing.

Project covers are original typographic artwork, not product screenshots. Team cards use initials, not unrelated stock portraits. Testimonials are short excerpts with the names, roles, and organizations stated by the source; the ellipsis denotes an excerpt.

## Content behavior

The reviewed records live in src/lib/company-content.ts. A nonempty Django collection takes precedence in full. When a collection is empty or cannot be loaded, the site uses the reviewed reference records for services, projects, team, and testimonials. Blog posts still come only from Django.

This ships useful company content with the code without writing to a production database or depending on the reference website at runtime. To retire these reference records permanently, edit the versioned content file. To manage content through Django, publish the replacement collection there.

Authentication, account updates, and contact submissions always use the real API. They never fall back to a simulated success.
