import { MODELS } from '../types'
import type { ModelId } from '../types'

interface Props {
  value: ModelId
  onChange: (model: ModelId) => void
  disabled?: boolean
}

export default function ModelSelector({ value, onChange, disabled }: Props) {
  return (
    <div className="model-selector">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ModelId)}
        disabled={disabled}
        title="Select AI model"
      >
        {MODELS.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label} — {m.description}
          </option>
        ))}
      </select>
    </div>
  )
}
