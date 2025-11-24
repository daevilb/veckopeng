import React from "react";
import clsx from "clsx";

interface AvatarPickerProps {
  avatars: string[];
  value: string;
  onChange: (avatar: string) => void;
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  avatars,
  value,
  onChange,
}) => {
  return (
    <div className="grid grid-cols-4 gap-3 bg-gray-50 dark:bg-gray-900/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50">
      {avatars.map((a) => (
        <button
          key={a}
          type="button"
          onClick={() => onChange(a)}
          className={clsx(
            "text-3xl h-12 w-full flex items-center justify-center rounded-xl border transition-all",
            value === a
              ? "bg-white dark:bg-gray-700 shadow-md ring-2 ring-primary-500 scale-110"
              : "opacity-70 hover:opacity-100 border-transparent"
          )}
        >
          {a}
        </button>
      ))}
    </div>
  );
};
