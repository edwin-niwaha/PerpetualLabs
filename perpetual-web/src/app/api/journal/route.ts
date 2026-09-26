import { saveJournal } from "@/lib/journal-actions";
export async function POST(request: Request) {
  // The shared proxy enforces same-origin requests; the service verifies staff access.
  if (Number(request.headers.get("content-length") || 0) > 5 * 1024 * 1024)
    return Response.json(
      { message: "Choose a cover image up to 4 MB." },
      { status: 413 },
    );
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json(
      { message: "The upload could not be read. Choose the file again." },
      { status: 400 },
    );
  }
  const value = form.get("id");
  const id = value ? Number(value) : null;
  const result = await saveJournal(id, {}, form);
  return Response.json(result, {
    status: result.ok ? 200 : result.status || 400,
    headers: { "Cache-Control": "private, no-store" },
  });
}
