import React from "react";
import type { Field } from "./types";
import type { Dispatch, SetStateAction } from "react";

type Props = {
  fields: Field[];
  possibleFields: Field[];
  setFields: Dispatch<SetStateAction<Field[]>>; 
};

const FieldSelector: React.FC<Props> = ({
  fields,
  possibleFields,
  setFields,
}) => (
  <div className="p-2 border rounded space-y-1">
    {possibleFields.map((f) => (
      <label key={f} className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={fields.includes(f)}
          onChange={() => {
            setFields((prev: Field[]) =>
              prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
            );
          }}
        />
        {f}
      </label>
    ))}
  </div>
);

export default FieldSelector;
