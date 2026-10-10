import { useId, useState } from "react";
import { EDITORIAL_HONOR_LABEL, presentMilestones, presentPublicLabels, publicLabelControlLabel } from "./achievement-presentation-model.ts";
import type { PublicAchievementLabel } from "./achievement-presentation-model.ts";
import type { PublicAchievement } from "./types.ts";
import "./achievement-presentation.css";

function AchievementLabelText({ label }: { label: PublicAchievementLabel }) {
  return (
    <span className="achievement-presentation__label">
      <span className="achievement-presentation__label-part">{label.category}</span>
      <span className="achievement-presentation__label-part">{label.award}</span>
      <span className="achievement-presentation__label-part">{label.year === null ? "Năm không rõ" : label.year}</span>
    </span>
  );
}

export function PublicAchievementLabels({ records }: { records: PublicAchievement[] }) {
  const split = presentPublicLabels(records);
  const [expanded, setExpanded] = useState(false);
  const overflowId = useId();
  if (split.visible.length === 0) return null;
  return (
    <div className="achievement-presentation achievement-presentation--labels">
      <ul className="achievement-presentation__labels">
        {split.visible.map(label => (
          <li key={label.id} className="achievement-presentation__label-item">
            <AchievementLabelText label={label} />
          </li>
        ))}
        {split.hiddenCount > 0 ? (
          <li className="achievement-presentation__expand-item">
            <button
              type="button"
              className="achievement-presentation__expand"
              aria-expanded={expanded}
              aria-controls={overflowId}
              aria-label={publicLabelControlLabel(split.hiddenCount, expanded)}
              onClick={() => setExpanded(current => !current)}
            >
              {expanded ? "Thu gọn" : `+${split.hiddenCount}`}
            </button>
          </li>
        ) : null}
        {split.hiddenCount > 0 ? (
          <li id={overflowId} className="achievement-presentation__overflow" hidden={!expanded}>
            <ul className="achievement-presentation__overflow-list">
              {split.overflow.map(label => (
                <li key={label.id} className="achievement-presentation__label-item">
                  <AchievementLabelText label={label} />
                </li>
              ))}
            </ul>
          </li>
        ) : null}
      </ul>
    </div>
  );
}

export function PublicAchievementMilestones({ records }: { records: PublicAchievement[] }) {
  const groups = presentMilestones(records);
  if (groups.length === 0) return null;
  return (
    <div className="achievement-presentation achievement-presentation--milestones">
      {groups.map(group => (
        <section key={group.year ?? "unknown"} className="achievement-presentation__year">
          <h3 className="achievement-presentation__year-title">{group.year === null ? "Năm không rõ" : `Năm ${group.year}`}</h3>
          <ol className="achievement-presentation__records">
            {group.records.map(record => (
              <li key={record.id} className="achievement-presentation__record">
                <p className="achievement-presentation__title">{record.title}</p>
                <p className="achievement-presentation__facts">
                  <span>{record.dateText}</span>
                  <span>{record.category}</span>
                  <span>{record.award}</span>
                  <span>{record.approvedText}</span>
                </p>
                {record.description ? <p className="achievement-presentation__description">{record.description}</p> : null}
                {record.participationText ? <p className="achievement-presentation__participation">{record.participationText}</p> : null}
                {record.pointsText ? <p className="achievement-presentation__points">{record.pointsText}</p> : null}
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

export function EditorialHonorLabel() {
  return <span className="achievement-presentation__honor">{EDITORIAL_HONOR_LABEL}</span>;
}
