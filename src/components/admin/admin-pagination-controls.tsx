import { Button } from "@/components/ui/button";

export function PaginationControls({
  page,
  canNext,
  onPrevious,
  onNext,
  previousLabel = "Previous",
  pageLabel = "Page",
  nextLabel = "Next",
}: {
  page: number;
  canNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  previousLabel?: string;
  pageLabel?: string;
  nextLabel?: string;
}) {
  return (
    <div className="mt-4 flex items-center justify-end gap-2 text-sm text-muted-foreground">
      <Button variant="outline" size="sm" onClick={onPrevious} disabled={page === 0}>
        {previousLabel}
      </Button>
      <span>
        {pageLabel} {page + 1}
      </span>
      <Button variant="outline" size="sm" onClick={onNext} disabled={!canNext}>
        {nextLabel}
      </Button>
    </div>
  );
}
