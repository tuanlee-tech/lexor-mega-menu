import { TextField } from "@shopify/polaris";

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  defaultSwatch?: string;
}

export function ColorField({
  label,
  value,
  onChange,
  placeholder = "#8C1B11",
  defaultSwatch = "#8C1B11",
}: ColorFieldProps) {
  const safeHex = /^#[0-9A-Fa-f]{6}$/.test(value) ? value : defaultSwatch;

  return (
    <TextField
      label={label}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete="off"
      prefix={
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            cursor: "pointer",
          }}
          title="Pick color"
        >
          <input
            type="color"
            value={safeHex}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            style={{
              width: "18px",
              height: "18px",
              border: "none",
              padding: 0,
              background: "transparent",
              cursor: "pointer",
            }}
          />
        </label>
      }
    />
  );
}
