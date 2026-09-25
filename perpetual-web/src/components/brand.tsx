import Link from "next/link";
export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="Perpetual Labs home">
      <span className="brand-mark" aria-hidden="true">
        p<span>l</span>
      </span>
      <span>
        perpetual<span className="brand-labs">labs</span>
      </span>
    </Link>
  );
}
