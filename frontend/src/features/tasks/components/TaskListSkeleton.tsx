import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const SKELETON_COUNT = 5;

export function TaskListSkeleton() {
  return (
    <ul className="divide-y divide-gray-100">
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <li key={i} className="flex items-center gap-4 px-4 py-3">
          <Skeleton circle width={20} height={20} />
          <div className="flex-1">
            <Skeleton height={14} width="60%" />
            <Skeleton height={11} width="28%" style={{ marginTop: 6 }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
