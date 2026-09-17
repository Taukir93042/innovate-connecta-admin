import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Subscript,
  Superscript,
  List,
  ListOrdered,
  Link as LinkIcon,
  Unlink,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Indent,
  Outdent,
  Table as TableIcon,
  Minus,
  Eraser,
  Undo,
  Redo,
  Code2,
  Eye,
  Maximize2,
  Minimize2,
  Palette,
  Highlighter,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface FCKEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
  disabled?: boolean
  className?: string
}

export function FCKEditor({
  value,
  onChange,
  placeholder = 'Type your content here...',
  minHeight = '200px',
  disabled = false,
  className,
}: FCKEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isSourceMode, setIsSourceMode] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [rawHtml, setRawHtml] = useState(value || '')
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [currentTag, setCurrentTag] = useState('p')
  const lastHtmlRef = useRef(value || '')

  // Update statistics
  const updateStats = (html: string) => {
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    const text = tempDiv.textContent || tempDiv.innerText || ''
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    setWordCount(words)
    setCharCount(text.length)
  }

  // Synchronize external value changes
  useEffect(() => {
    if (value !== lastHtmlRef.current) {
      lastHtmlRef.current = value || ''
      setRawHtml(value || '')
      if (editorRef.current && !isSourceMode) {
        editorRef.current.innerHTML = value || ''
      }
      updateStats(value || '')
    }
  }, [value, isSourceMode])

  // Initialize content on mount / toggle mode
  useEffect(() => {
    if (editorRef.current && !isSourceMode) {
      if (editorRef.current.innerHTML !== (value || '')) {
        editorRef.current.innerHTML = value || ''
      }
    }
    updateStats(value || '')
  }, [isSourceMode])

  const executeCommand = (command: string, arg: string | undefined = undefined) => {
    if (disabled || isSourceMode) return
    editorRef.current?.focus()
    document.execCommand(command, false, arg)
    handleEditorInput()
  }

  const handleEditorInput = () => {
    if (!editorRef.current) return
    let html = editorRef.current.innerHTML

    if (
      html === '<p><br></p>' ||
      html === '<br>' ||
      html === '<div><br></div>' ||
      html.trim() === ''
    ) {
      html = ''
    }

    lastHtmlRef.current = html
    setRawHtml(html)
    updateStats(html)
    onChange(html)

    // Detect active tag for status bar
    try {
      const sel = window.getSelection()
      if (sel && sel.anchorNode) {
        const parent = sel.anchorNode.parentElement
        if (parent) {
          setCurrentTag(parent.tagName.toLowerCase())
        }
      }
    } catch {
      setCurrentTag('p')
    }
  }

  const handleRawHtmlChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const html = e.target.value
    setRawHtml(html)
    lastHtmlRef.current = html
    updateStats(html)
    onChange(html)
  }

  const handleFormatChange = (tag: string) => {
    if (disabled || isSourceMode) return
    executeCommand('formatBlock', tag)
  }

  const handleFontSizeChange = (size: string) => {
    if (disabled || isSourceMode) return
    executeCommand('fontSize', size)
  }

  const handleInsertLink = () => {
    if (disabled || isSourceMode) return
    const url = window.prompt('Enter target URL (e.g. https://example.com):', 'https://')
    if (url && url !== 'https://') {
      executeCommand('createLink', url)
    }
  }

  const handleInsertTable = () => {
    if (disabled || isSourceMode) return
    const rows = prompt('Number of table rows:', '3')
    const cols = prompt('Number of table columns:', '3')
    const numRows = parseInt(rows || '3', 10)
    const numCols = parseInt(cols || '3', 10)

    if (numRows > 0 && numCols > 0) {
      let tableHtml = '<table class="fck-table" style="width:100%; border-collapse:collapse; margin:1rem 0;"><tbody>'
      for (let r = 0; r < numRows; r++) {
        tableHtml += '<tr>'
        for (let c = 0; c < numCols; c++) {
          if (r === 0) {
            tableHtml += '<th style="border:1px solid #64748b; padding:8px 12px; font-weight:600; background:rgba(100,116,139,0.15);">Header ' + (c + 1) + '</th>'
          } else {
            tableHtml += '<td style="border:1px solid #64748b; padding:8px 12px;">Cell ' + (r + 1) + ',' + (c + 1) + '</td>'
          }
        }
        tableHtml += '</tr>'
      }
      tableHtml += '</tbody></table><p><br></p>'
      executeCommand('insertHTML', tableHtml)
    }
  }

  const handleInsertHorizontalRule = () => {
    if (disabled || isSourceMode) return
    executeCommand('insertHorizontalRule')
  }

  const handleColorChange = (type: 'foreColor' | 'hiliteColor') => {
    if (disabled || isSourceMode) return
    const defaultColor = type === 'foreColor' ? '#3b82f6' : '#fef08a'
    const color = window.prompt('Enter color HEX or RGB (e.g. #2563eb):', defaultColor)
    if (color) {
      executeCommand(type, color)
    }
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn(
          'fck-editor-container flex flex-col rounded-lg border border-border bg-card/60 backdrop-blur-xs shadow-xs transition-all',
          isFullscreen && 'fixed inset-4 z-50 bg-background shadow-2xl border-primary/50',
          disabled && 'opacity-60 pointer-events-none',
          className
        )}
      >
        {/* FCKeditor Toolbar */}
        <div className='fck-toolbar flex flex-wrap items-center gap-1 border-b border-border bg-muted/50 p-2 rounded-t-lg'>
          {/* Group 1: Source & History */}
          <div className='flex items-center gap-0.5'>
            <ToolbarButton
              title='Source (HTML Code View)'
              onClick={() => setIsSourceMode(!isSourceMode)}
              active={isSourceMode}
              icon={isSourceMode ? <Eye className='h-3.5 w-3.5 text-primary' /> : <Code2 className='h-3.5 w-3.5' />}
            />
            <Separator orientation='vertical' className='mx-1 h-5' />
            <ToolbarButton
              title='Undo (Ctrl+Z)'
              onClick={() => executeCommand('undo')}
              icon={<Undo className='h-3.5 w-3.5' />}
            />
            <ToolbarButton
              title='Redo (Ctrl+Y)'
              onClick={() => executeCommand('redo')}
              icon={<Redo className='h-3.5 w-3.5' />}
            />
          </div>

          <Separator orientation='vertical' className='mx-1 h-5' />

          {/* Group 2: Format & Font Dropdowns */}
          <div className='flex items-center gap-1.5'>
            <Select onValueChange={handleFormatChange} defaultValue='<p>' disabled={disabled || isSourceMode}>
              <SelectTrigger className='h-7 w-[120px] text-xs font-medium'>
                <SelectValue placeholder='Format' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='<p>'>Paragraph</SelectItem>
                <SelectItem value='<h1>'>Heading 1</SelectItem>
                <SelectItem value='<h2>'>Heading 2</SelectItem>
                <SelectItem value='<h3>'>Heading 3</SelectItem>
                <SelectItem value='<h4>'>Heading 4</SelectItem>
                <SelectItem value='<pre>'>Code / Pre</SelectItem>
                <SelectItem value='<blockquote>'>Blockquote</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={handleFontSizeChange} defaultValue='3' disabled={disabled || isSourceMode}>
              <SelectTrigger className='h-7 w-[95px] text-xs'>
                <SelectValue placeholder='Size' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='1'>10px</SelectItem>
                <SelectItem value='2'>12px</SelectItem>
                <SelectItem value='3'>Normal (14px)</SelectItem>
                <SelectItem value='4'>16px</SelectItem>
                <SelectItem value='5'>18px</SelectItem>
                <SelectItem value='6'>24px</SelectItem>
                <SelectItem value='7'>32px</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator orientation='vertical' className='mx-1 h-5' />

          {/* Group 3: Text Styling */}
          <div className='flex items-center gap-0.5'>
            <ToolbarButton
              title='Bold (Ctrl+B)'
              onClick={() => executeCommand('bold')}
              icon={<Bold className='h-3.5 w-3.5' />}
            />
            <ToolbarButton
              title='Italic (Ctrl+I)'
              onClick={() => executeCommand('italic')}
              icon={<Italic className='h-3.5 w-3.5' />}
            />
            <ToolbarButton
              title='Underline (Ctrl+U)'
              onClick={() => executeCommand('underline')}
              icon={<Underline className='h-3.5 w-3.5' />}
            />
            <ToolbarButton
              title='Strikethrough'
              onClick={() => executeCommand('strikeThrough')}
              icon={<Strikethrough className='h-3.5 w-3.5' />}
            />
            <ToolbarButton
              title='Subscript'
              onClick={() => executeCommand('subscript')}
              icon={<Subscript className='h-3.5 w-3.5' />}
            />
            <ToolbarButton
              title='Superscript'
              onClick={() => executeCommand('superscript')}
              icon={<Superscript className='h-3.5 w-3.5' />}
            />
          </div>

          <Separator orientation='vertical' className='mx-1 h-5' />

          {/* Group 4: Colors */}
          <div className='flex items-center gap-0.5'>
            <ToolbarButton
              title='Text Color'
              onClick={() => handleColorChange('foreColor')}
              icon={<Palette className='h-3.5 w-3.5 text-blue-500' />}
            />
            <ToolbarButton
              title='Highlight Color'
              onClick={() => handleColorChange('hiliteColor')}
              icon={<Highlighter className='h-3.5 w-3.5 text-amber-500' />}
            />
          </div>

          <Separator orientation='vertical' className='mx-1 h-5' />

          {/* Group 5: Alignment */}
          <div className='flex items-center gap-0.5'>
            <ToolbarButton
              title='Align Left'
              onClick={() => executeCommand('justifyLeft')}
              icon={<AlignLeft className='h-3.5 w-3.5' />}
            />
            <ToolbarButton
              title='Align Center'
              onClick={() => executeCommand('justifyCenter')}
              icon={<AlignCenter className='h-3.5 w-3.5' />}
            />
            <ToolbarButton
              title='Align Right'
              onClick={() => executeCommand('justifyRight')}
              icon={<AlignRight className='h-3.5 w-3.5' />}
            />
            <ToolbarButton
              title='Justify'
              onClick={() => executeCommand('justifyFull')}
              icon={<AlignJustify className='h-3.5 w-3.5' />}
            />
          </div>

          <Separator orientation='vertical' className='mx-1 h-5' />

          {/* Group 6: Lists & Indentation */}
          <div className='flex items-center gap-0.5'>
            <ToolbarButton
              title='Bulleted List'
              onClick={() => executeCommand('insertUnorderedList')}
              icon={<List className='h-3.5 w-3.5' />}
            />
            <ToolbarButton
              title='Numbered List'
              onClick={() => executeCommand('insertOrderedList')}
              icon={<ListOrdered className='h-3.5 w-3.5' />}
            />
            <ToolbarButton
              title='Decrease Indent'
              onClick={() => executeCommand('outdent')}
              icon={<Outdent className='h-3.5 w-3.5' />}
            />
            <ToolbarButton
              title='Increase Indent'
              onClick={() => executeCommand('indent')}
              icon={<Indent className='h-3.5 w-3.5' />}
            />
          </div>

          <Separator orientation='vertical' className='mx-1 h-5' />

          {/* Group 7: Insert & Tools */}
          <div className='flex items-center gap-0.5'>
            <ToolbarButton
              title='Insert Link'
              onClick={handleInsertLink}
              icon={<LinkIcon className='h-3.5 w-3.5' />}
            />
            <ToolbarButton
              title='Remove Link'
              onClick={() => executeCommand('unlink')}
              icon={<Unlink className='h-3.5 w-3.5' />}
            />
            <ToolbarButton
              title='Insert Table'
              onClick={handleInsertTable}
              icon={<TableIcon className='h-3.5 w-3.5' />}
            />
            <ToolbarButton
              title='Horizontal Line'
              onClick={handleInsertHorizontalRule}
              icon={<Minus className='h-3.5 w-3.5' />}
            />
            <ToolbarButton
              title='Clear Formatting'
              onClick={() => executeCommand('removeFormat')}
              icon={<Eraser className='h-3.5 w-3.5' />}
            />
          </div>

          {/* Fullscreen toggle right aligned */}
          <div className='ml-auto flex items-center gap-1'>
            <ToolbarButton
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              onClick={() => setIsFullscreen(!isFullscreen)}
              icon={isFullscreen ? <Minimize2 className='h-3.5 w-3.5' /> : <Maximize2 className='h-3.5 w-3.5' />}
            />
          </div>
        </div>

        {/* Editor Body */}
        {isSourceMode ? (
          <textarea
            value={rawHtml}
            onChange={handleRawHtmlChange}
            placeholder='Write HTML code here...'
            style={{ minHeight: isFullscreen ? 'calc(100vh - 120px)' : minHeight }}
            disabled={disabled}
            className='w-full resize-y bg-muted/20 p-4 font-mono text-xs text-foreground focus:outline-hidden focus:ring-0 leading-relaxed'
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable={!disabled}
            onInput={handleEditorInput}
            onBlur={handleEditorInput}
            onKeyUp={handleEditorInput}
            onClick={handleEditorInput}
            data-placeholder={placeholder}
            style={{ minHeight: isFullscreen ? 'calc(100vh - 120px)' : minHeight }}
            className={cn(
              'fck-content-area prose prose-sm dark:prose-invert max-w-none p-4 focus:outline-hidden overflow-y-auto leading-relaxed',
              'empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none',
              // Rich content typography styling
              '[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:mt-4',
              '[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2.5 [&_h2]:mt-3',
              '[&_h3]:text-lg [&_h3]:font-medium [&_h3]:mb-2 [&_h3]:mt-2.5',
              '[&_h4]:text-base [&_h4]:font-medium [&_h4]:mb-1.5 [&_h4]:mt-2',
              '[&_p]:mb-2 [&_p]:leading-relaxed',
              '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-2.5',
              '[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-2.5',
              '[&_li]:mb-1',
              '[&_blockquote]:border-l-4 [&_blockquote]:border-primary/60 [&_blockquote]:pl-3.5 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-3',
              '[&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded-md [&_pre]:font-mono [&_pre]:text-xs [&_pre]:my-2.5 [&_pre]:overflow-x-auto',
              '[&_table]:w-full [&_table]:border-collapse [&_table]:my-3',
              '[&_th]:border [&_th]:border-border [&_th]:p-2 [&_th]:bg-muted/40 [&_th]:font-semibold',
              '[&_td]:border [&_td]:border-border [&_td]:p-2',
              '[&_hr]:my-4 [&_hr]:border-border',
              '[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2'
            )}
          />
        )}

        {/* FCKeditor Status Bar */}
        <div className='fck-statusbar flex items-center justify-between border-t border-border/70 bg-muted/30 px-3 py-1 text-[11px] text-muted-foreground rounded-b-lg select-none'>
          <div className='flex items-center gap-2'>
            <span className='font-mono font-medium text-foreground/70'>
              Path: body &gt; {currentTag}
            </span>
            {isSourceMode && (
              <span className='rounded bg-amber-500/15 px-1.5 py-0.2 text-[10px] text-amber-600 dark:text-amber-400 font-semibold'>
                HTML Mode
              </span>
            )}
          </div>
          <div className='flex items-center gap-3'>
            <span>{wordCount} words</span>
            <span>•</span>
            <span>{charCount} characters</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

interface ToolbarButtonProps {
  title: string
  onClick: () => void
  icon?: React.ReactNode
  active?: boolean
}

function ToolbarButton({ title, onClick, icon, active }: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type='button'
          variant={active ? 'secondary' : 'ghost'}
          size='icon'
          onClick={onClick}
          className={cn(
            'h-7 w-7 rounded-sm text-muted-foreground hover:text-foreground transition-colors',
            active && 'bg-accent text-accent-foreground font-semibold shadow-xs'
          )}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent side='bottom' className='text-xs py-1 px-2 z-50'>
        {title}
      </TooltipContent>
    </Tooltip>
  )
}

// Re-export as CKEditorComponent for drop-in compatibility
export { FCKEditor as CKEditorComponent }
