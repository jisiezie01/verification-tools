import InputToolCategory from "../../../../components/InputToolCategory"
import InputToggle from "../../../../components/InputToggle"
import InputSetting from "../InputSetting"
import type { ContainerToolSettingsProps } from "./types"

const ContainerToolSettings = ({ tool, categories, onNameChange, onCategoryChange, onGlobalChange, onCreateCategory, className = "" }: ContainerToolSettingsProps) => {
    return <div className={`space-y-6 ${className}`}>
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Tool settings</p><h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-800">Make it yours</h2><p className="mt-2 text-xs leading-5 text-slate-500">Name your tool and choose where it belongs.</p></div>
        <InputSetting label="Tool name" value={tool.name} placeholder="e.g. Reference generator" onChange={onNameChange} />
        <InputToolCategory value={tool.categoryId} categories={categories} onChange={onCategoryChange} onCreate={onCreateCategory} />
        <div className="space-y-2"><InputToggle label="Global tool" checked={!!tool.isGlobal} onChange={onGlobalChange} /><p className="text-xs leading-5 text-slate-500">Share this tool's inputs with other tools in the same category. Keep it on the category board to enter shared values. Global variable names must be unique within the category.</p></div>
        <div className="rounded-2xl border border-white/80 bg-white/50 p-4"><h3 className="text-xs font-semibold text-slate-600">Build your way</h3><p className="mt-2 text-xs leading-6 text-slate-500">Add inputs to collect values. Connect a generate button to generated text, then use variables to make it personal.</p><p className="mt-2 text-xs leading-6 text-slate-500">Select any element to edit its settings. Click the canvas background to return here.</p></div>
    </div>
}
export default ContainerToolSettings
