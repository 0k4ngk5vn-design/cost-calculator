import * as React from "react"
import { Search } from "lucide-react"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"

function InputSearch({
  className,
  type,
  value,
  onChange,
  placeholder,
  ...props
}) {
  return (
    <InputGroup className="bg-gray-200/70 has-[[data-slot=input-group-control]:focus-visible]:border-input
    has-[[data-slot=input-group-control]:focus-visible]:ring-0">
      <InputGroupInput className="text-sm" placeholder={placeholder} value={value} onChange={(e) => onChange?.(e.target.value)}/>
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
    </InputGroup>
  );
}

export { InputSearch }
