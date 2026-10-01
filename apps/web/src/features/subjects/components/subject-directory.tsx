import { useState } from "react";
import { ArrowUpRight, BookOpen, RefreshCw, Search } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDocumentMetadata } from "@/features/documents/hooks/use-documents";
import { ROUTES } from "@/router/route-constants";
import "./subject-directory.css";

function normalizeSearch(value: string) {
  return value.toLocaleLowerCase("vi-VN").normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/g, "d").trim();
}

export function SubjectDirectory() {
  const [keyword, setKeyword] = useState("");
  const metadata = useDocumentMetadata();
  const subjects = metadata.data?.subjects ?? [];
  const normalizedKeyword = normalizeSearch(keyword);
  const visibleSubjects = subjects
    .filter((subject) => normalizeSearch(`${subject.name} ${subject.code ?? ""}`).includes(normalizedKeyword))
    .sort((first, second) => first.name.localeCompare(second.name, "vi-VN"));

  return (
    <section className="subject-directory" aria-labelledby="subjects-title">
      <header className="subject-directory__intro">
        <div>
          <h1 id="subjects-title">Môn học</h1>
          <p>Chọn môn bạn đang học để tìm tài liệu, giáo trình và đề ôn tập.</p>
        </div>
        <Link to={ROUTES.DOCUMENTS} className="subject-directory__browse">
          <BookOpen aria-hidden="true" /> Toàn bộ tài liệu
        </Link>
      </header>

      <div className="subject-directory__catalogue">
        <div className="subject-directory__toolbar">
          <div className="subject-directory__search">
            <label htmlFor="subject-search">Tìm môn học</label>
            <div className="subject-directory__search-field">
              <Search aria-hidden="true" />
              <Input
                id="subject-search"
                type="search"
                placeholder="Tên môn hoặc mã môn…"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                aria-controls="subject-results"
                autoComplete="off"
              />
            </div>
          </div>
          <p className="subject-directory__count" role="status">
            {metadata.data && (normalizedKeyword
              ? `${visibleSubjects.length} / ${subjects.length} môn học`
              : `${subjects.length} môn học`)}
          </p>
        </div>

        <div id="subject-results" aria-busy={metadata.isPending}>
          {metadata.isPending ? (
            <div className="subject-directory__loading" role="status">
              <span className="sr-only">Đang tải danh sách môn học…</span>
              <div className="subject-directory__list" aria-hidden="true">
                {[0, 1, 2, 3, 4, 5].map((item) => (
                  <div key={item} className="subject-directory__skeleton"><span /><span /><span /></div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {metadata.isError && (
                <div className="subject-directory__feedback" role="status">
                  <h2>{metadata.data ? "Chưa thể cập nhật danh sách môn học." : "Chưa tải được môn học."}</h2>
                  <p>Thử kết nối lại hoặc mở kho tài liệu để tiếp tục tìm kiếm.</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="subject-directory__retry"
                    disabled={metadata.isFetching}
                    onClick={() => void metadata.refetch()}
                  >
                    <RefreshCw aria-hidden="true" />
                    {metadata.isFetching ? "Đang thử lại…" : "Thử lại"}
                  </Button>
                </div>
              )}

              {metadata.data && (visibleSubjects.length ? (
                <ul className="subject-directory__list">
                  {visibleSubjects.map((subject) => (
                    <li key={subject.id}>
                      <Link
                        to={`${ROUTES.DOCUMENTS}?${new URLSearchParams({ subjectId: subject.id })}`}
                        className="subject-directory__subject"
                      >
                        <div className="subject-directory__subject-body">
                          {subject.code && <p className="subject-directory__code">{subject.code}</p>}
                          <h2>{subject.name}</h2>
                          {subject.description && <p className="subject-directory__description">{subject.description}</p>}
                          <span className="subject-directory__action">Xem tài liệu</span>
                        </div>
                        <ArrowUpRight aria-hidden="true" className="subject-directory__arrow" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : !metadata.isError && (
                <div className="subject-directory__feedback" role="status">
                  <h2>{subjects.length ? "Chưa tìm thấy môn học phù hợp." : "Danh mục môn học đang được cập nhật."}</h2>
                  <p>{subjects.length ? "Thử tên ngắn hơn hoặc tìm bằng mã môn." : "Bạn vẫn có thể tìm kiếm trong kho tài liệu."}</p>
                  {subjects.length > 0 && (
                    <Button type="button" variant="outline" className="subject-directory__retry" onClick={() => setKeyword("")}>
                      Xem tất cả môn học
                    </Button>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
