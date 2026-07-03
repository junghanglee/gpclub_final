import { Button } from "@/components/ui/button";

export const ADMIN_PAGE_SIZE = 25;
export const CHATBOT_RECORD_LIMIT = 200;

export const pageRange = (page: number, pageSize = ADMIN_PAGE_SIZE) => {
  const from = page * pageSize;
  return { from, to: from + pageSize - 1 };
};

export function PaginationControls({
  page,
  canNext,
  onPrevious,
  onNext,
}: {
  page: number;
  canNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-end gap-2 text-sm text-muted-foreground">
      <Button variant="outline" size="sm" onClick={onPrevious} disabled={page === 0}>
        Previous
      </Button>
      <span>Page {page + 1}</span>
      <Button variant="outline" size="sm" onClick={onNext} disabled={!canNext}>
        Next
      </Button>
    </div>
  );
}
