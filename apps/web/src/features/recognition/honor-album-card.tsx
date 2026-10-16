import { ArrowRight, ImageOff } from "lucide-react";
import { Link } from "react-router-dom";
import { HonorImage, Participants } from "./components";
import type { Honor } from "./types";

/** An album teaser, not a second achievement history or a source of points. */
export function HonorAlbumCard({ honor, from }: { honor: Honor; from: string }) {
  const cover = honor.photos[0];
  const remaining = Math.max(0, honor.participants.length - 2);
  return <article className={`recognition-memory${cover ? "" : " recognition-memory--no-photo"}`}>
    <div className={`recognition-memory__photo${cover ? "" : " recognition-memory__no-photo"}`}>
      {cover ? <HonorImage honor={honor} photoId={cover.id} alt={`Kỷ niệm ${honor.title}`} />
        : <><ImageOff aria-hidden="true" size={24} /><span>Album chưa có ảnh</span></>}
    </div>
    <div className="recognition-memory__body">
      <header className="recognition-memory__heading">
        <p className="recognition-memory__context"><span>{honor.year}</span>{honor.subject && <span>{honor.subject}</span>}</p>
        <h2><Link to={`/honors/${honor.id}`} state={{ from }} title={honor.title}><span className="recognition-memory__title">{honor.title}</span></Link></h2>
      </header>
      <div className="recognition-memory__attribution">
        {honor.participants.length ? <Participants items={honor.participants.slice(0, 2)} compact from={from} /> : <p className="recognition-hint">Chưa có thông tin người tham gia</p>}
        <p className="recognition-hint">{remaining > 0 ? `Cùng ${remaining} người khác` : ""}</p>
      </div>
      <footer className="recognition-memory__footer">
        <span className="recognition-hint">{honor.photos.length} ảnh</span>
        <Link className="recognition-memory__action" to={`/honors/${honor.id}`} state={{ from }} aria-label={`Xem album ${honor.title}`}>
          Xem album <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </footer>
    </div>
  </article>;
}
