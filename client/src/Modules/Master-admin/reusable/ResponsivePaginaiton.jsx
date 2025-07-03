import { useEffect, useState } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"; // Adjust this import as per your project

const ResponsivePagination = ({ pagination, setPagination }) => {
  const [visiblePages, setVisiblePages] = useState(5);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 500) {
        setVisiblePages(3);
      } else if (window.innerWidth < 768) {
        setVisiblePages(5);
      } else {
        setVisiblePages(7);
      }
    };

    handleResize(); // Set on initial render
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { page, totalPages } = pagination;

  const getPageNumbers = () => {
    const half = Math.floor(visiblePages / 2);
    let start = Math.max(1, page - half);
    let end = Math.min(totalPages, start + visiblePages - 1);

    if (end - start < visiblePages - 1) {
      start = Math.max(1, end - visiblePages + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <div className="pt-4 w-full">
      <div className="mx-auto max-w-fit">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.max(prev.page - 1, 1),
                  }));
                }}
              />
            </PaginationItem>

            {getPageNumbers().map((p) => (
              <PaginationItem key={p}>
                <PaginationLink
                  href="#"
                  isActive={p === page}
                  onClick={(e) => {
                    e.preventDefault();
                    setPagination((prev) => ({ ...prev, page: p }));
                  }}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.min(prev.page + 1, totalPages),
                  }));
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};

export default ResponsivePagination;
