import { Button } from "@/components/ui/button";
export function Pagination({
  page,
  lastPage,
  onChange,
}: {
  page: number;
  lastPage: number;
  onChange: (page: number) => void;
}) {
  return (
    <nav
      className="flex flex-wrap items-center gap-3 mt-5"
      aria-label="Result pages"
    >
      <Button
        variant="outline"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Previous
      </Button>
      <span>
        Page {page} of {Math.max(lastPage, 1)}
      </span>
      <Button
        variant="outline"
        disabled={page >= lastPage}
        onClick={() => onChange(page + 1)}
      >
        Next
      </Button>
    </nav>
  );
}
