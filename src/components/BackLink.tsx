import { Link } from "react-router";

export function BackLink() {
  return (
    <Link to="/" className="inline-block text-xs font-extrabold text-ink/60 hover:text-cf-orange">
      ← デモ一覧
    </Link>
  );
}
