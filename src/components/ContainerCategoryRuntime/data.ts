import { createContext } from "react"
import type { CategoryRuntimeContextType } from "./types"

export const CategoryRuntimeContext = createContext<CategoryRuntimeContextType | undefined>(undefined)
