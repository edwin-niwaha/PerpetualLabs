# Website content management

Sign in with an existing staff account and open `/account/content`. No separate Django admin session is needed.

- People of Perpetual: create/edit/remove members; upload, replace or clear portraits.
- Services and testimonials: create/edit/delete content; testimonials support portrait uploads.
- Products: create/edit/delete, publish/unpublish, upload/replace/clear images.
- Site images: replace existing artwork and edit its alternative text and attribution.
- Journal & daily posts: write drafts, publish/schedule posts, and upload/remove covers in `/account/journal`.

Images accept JPEG, PNG and WebP up to 4 MB and 16 million pixels. The API validates and re-encodes images as WebP. New files use random names. Replacing/removing an image removes its reference; storage files are retained to avoid deleting shared or previously published assets.

All management endpoints require staff access. Web actions forward HTTP-only session credentials on the server. Existing same-origin request checks apply to uploads and deletions. Deletions require an explicit confirmation in the editor.

Deploy the API and web together and run `python manage.py migrate` for the product, testimonial and journal image migrations. Development uses local media storage; production uses the configured Cloudinary storage. Empty API collections are respected so deleted content does not return from fallback records.
