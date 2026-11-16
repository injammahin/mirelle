import { Images, Frame, Flower2, Palette, Type, SlidersHorizontal, Layers, Download, ScrollText, PenLine, CaseSensitive, Stamp, Leaf } from 'lucide-react'
import PhotosPanel from '../photo/PhotosPanel'
import FramesPanel from '../photo/FramesPanel'
import StickersPanel from '../photo/StickersPanel'
import FiltersPanel from '../photo/FiltersPanel'
import AdjustPanel from '../photo/AdjustPanel'
import TextPanel from '../photo/TextPanel'
import LayerPanel from '../photo/LayerPanel'
import ExportPanel from './ExportPanel'
import { PaperPanel, WritePanel, TypePanel, SealPanel, BotanicalsPanel } from '../letter/LetterPanels'

const i = (C) => <C size={17} />

export const PHOTO_TOOLS = [
  { id: 'photos', label: 'Photos', icon: Images, side: 'left', render: () => <PhotosPanel /> },
  { id: 'frames', label: 'Frames', icon: Frame, side: 'left', render: () => <FramesPanel /> },
  { id: 'stickers', label: 'Stickers', icon: Flower2, side: 'left', render: () => <StickersPanel /> },
  { id: 'filters', label: 'Filters', icon: Palette, side: 'left', render: () => <FiltersPanel /> },
  { id: 'text', label: 'Text', icon: Type, side: 'left', render: () => <TextPanel /> },
  { id: 'layers', label: 'Layer', icon: Layers, side: 'right', render: () => <LayerPanel /> },
  { id: 'tune', label: 'Tune', icon: SlidersHorizontal, side: 'right', render: () => <AdjustPanel /> },
  { id: 'export', label: 'Export', icon: Download, side: 'right', render: () => <ExportPanel kind="photo" /> },
]

export const LETTER_TOOLS = [
  { id: 'paper', label: 'Paper', icon: ScrollText, side: 'left', render: () => <PaperPanel /> },
  { id: 'seal', label: 'Seal', icon: Stamp, side: 'left', render: () => <SealPanel /> },
  { id: 'stickers', label: 'Stickers', icon: Leaf, side: 'left', render: () => <StickersPanel /> },
  { id: 'write', label: 'Write', icon: PenLine, side: 'right', render: () => <WritePanel /> },
  { id: 'type', label: 'Type', icon: CaseSensitive, side: 'right', render: () => <TypePanel /> },
  { id: 'export', label: 'Export', icon: Download, side: 'right', render: () => <ExportPanel kind="letter" /> },
]

export const toTabs = (tools) => tools.map((t) => ({ ...t, icon: i(t.icon) }))
