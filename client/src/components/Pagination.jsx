const pageNumbers = (page, total) => {
 if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const shown = [...new Set([1, total, page - 1, page, page + 1])]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  return shown.flatMap((p, i) => (i > 0 && p - shown[i - 1] > 1 ? ["…", p] : [p]));
};

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const base = "min-w-8 cursor-pointer rounded border px-2.5 py-1 text-[13px]";
  const idle = "border-[#2b2b2b] bg-white hover:bg-gray-100";
  const off = "disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <nav aria-label="Pagination" className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className={`${base} ${idle} ${off}`}
      >
        Prev
      </button>

      {pageNumbers(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-gray-500">…</span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={`${base} ${p === page ? "border-[#4a1f1f] bg-[#4a1f1f] font-bold text-white" : idle}`}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className={`${base} ${idle} ${off}`}
      >
        Next
      </button>
    </nav>
  );
}