import React, { useEffect, useRef, useState } from 'react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Unlink,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Eraser,
  Undo,
  Redo,
  CodeXml,
  Eye,
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

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
  className?: string
  disabled?: boolean
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Type your content here...',
  minHeight = '180px',
  className,
  disabled = false,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isHtmlMode, setIsHtmlMode] = useState(false)
  const [rawHtml, setRawHtml] = useState(value || '')
  const lastHtmlRef = useRef(value || '')

  // Keep internal editor in sync with external value if changed externally
  useEffect(() => {
    if (value !== lastHtmlRef.current) {
      lastHtmlRef.current = value || ''
      setRawHtml(value || '')
      if (editorRef.current && !isHtmlMode) {
        editorRef.current.innerHTML = value || ''
      }
    }
  }, [value, isHtmlMode])

  // Initialize editor content once mounted
  useEffect(() => {
    if (editorRef.current && !isHtmlMode) {
      if (editorRef.current.innerHTML !== (value || '')) {
        editorRef.current.innerHTML = value || ''
      }
    }
  }, [isHtmlMode])

  const executeCommand = (command: string, arg: string | undefined = undefined) => {
    if (disabled || isHtmlMode) return
    editorRef.current?.focus()
    document.execCommand(command, false, arg)
    handleEditorInput()
  }

  const handleEditorInput = () => {
    if (!editorRef.current) return
    let html = editorRef.current.innerHTML

    // If completely empty or just br/p, normalize
    if (html === '<p><br></p>' || html === '<br>' || html.trim() === '') {
      html = ''
    }

    lastHtmlRef.current = html
    setRawHtml(html)
    onChange(html)
  }

  const handleRawHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const html = e.target.value
    setRawHtml(html)
    lastHtmlRef.current = html
    onChange(html)
  }

  const handleInsertLink = () => {
    if (disabled || isHtmlMode) return
    const url = window.prompt('Enter URL (e.g. https://example.com):')
    if (url) {
      executeCommand('createLink', url)
    }
  }

  const handleHeading = (tag: string) => {
    if (disabled || isHtmlMode) return
    executeCommand('formatBlock', tag)
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          'flex flex-col rounded-lg border bg-background/50 backdrop-blur-sm shadow-xs transition-colors focus-within:border-ring focus-within:ring-1 focus-within:ring-ring',
          disabled && 'opacity-60 pointer-events-none',
          className
        )}
      >
        {/* Editor Toolbar */}
        <div className='flex flex-wrap items-center gap-1 border-b bg-muted/40 p-1.5 rounded-t-lg'>
          {/* Text Style */}
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
          </div>

          <Separator orientation='vertical' className='mx-1 h-5' />

          {/* Headings */}
          <div className='flex items-center gap-0.5'>
            <ToolbarButton
              title='Heading 1'
              onClick={() => handleHeading('<h1>')}
              icon={<Heading1 className='h-3.5 w-3.5' />}
            />
            <ToolbarButton
              title='Heading 2'
              onClick={() => handleHeading('<h2>')}
              icon={<Heading2 className='h-3.5 w-3.5' />}
            />
            <ToolbarButton
              title='Heading 3'
              onClick={() => handleHeading('<h3>')}
              icon={<Heading3 className='h-3.5 w-3.5' />}
            />
            <ToolbarButton
              title='Paragraph'
              onClick={() => handleHeading('<p>')}
              text='P'
            />
          </div>

          <Separator orientation='vertical' className='mx-1 h-5' />

          {/* Lists & Quotes */}
          <div className='flex items-center gap-0.5'>
            <ToolbarButton
              title='Bullet List'
              onClick={() => executeCommand('insertUnorderedList')}
              icon={<List className='h-3.5 w-3.5' />}
            />
            <ToolbarButton
              title='Numbered List'
              onClick={() => executeCommand('insertOrderedList')}
              icon={<ListOrdered className='h-3.5 w-3.5' />}
            />
            <ToolbarButton
              title='Blockquote'
              onClick={() => handleHeading('<blockquote>')}
              icon={<Quote className='h-3.5 w-3.5' />}
            />
            <ToolbarButton
              title='Code Block'
              onClick={() => handleHeading('<pre>')}
              icon={<Code className='h-3.5 w-3.5' />}
            />
          </div>

          <Separator orientation='vertical' className='mx-1 h-5' />

          {/* Alignment */}
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
          </div>

          <Separator orientation='vertical' className='mx-1 h-5' />

          {/* Links & Clear */}
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
              title='Clear Formatting'
              onClick={() => executeCommand('removeFormat')}
              icon={<Eraser className='h-3.5 w-3.5' />}
            />
          </div>

          <Separator orientation='vertical' className='mx-1 h-5' />

          {/* Undo / Redo */}
          <div className='flex items-center gap-0.5'>
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

          {/* Right Mode Toggle (Visual / HTML) */}
          <div className='ml-auto flex items-center gap-1'>
            <Button
              type='button'
              variant={isHtmlMode ? 'secondary' : 'ghost'}
              size='sm'
              onClick={() => setIsHtmlMode(!isHtmlMode)}
              className='h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground'
            >
              {isHtmlMode ? (
                <>
                  <Eye className='h-3.5 w-3.5' /> Visual View
                </>
              ) : (
                <>
                  <CodeXml className='h-3.5 w-3.5' /> HTML Code
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Editor Body */}
        {isHtmlMode ? (
          <textarea
            value={rawHtml}
            onChange={handleRawHtmlChange}
            placeholder='Write or paste raw HTML code here...'
            style={{ minHeight }}
            disabled={disabled}
            className='w-full resize-y bg-transparent p-3 font-mono text-xs text-foreground outline-none focus:ring-0 leading-relaxed'
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable={!disabled}
            onInput={handleEditorInput}
            onBlur={handleEditorInput}
            data-placeholder={placeholder}
            style={{ minHeight }}
            className={cn(
              'prose prose-sm dark:prose-invert max-w-none p-3.5 focus:outline-none overflow-y-auto leading-relaxed',
              'empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none',
              // Rich content typography styling
              '[&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-2 [&_h1]:mt-3',
              '[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-1.5 [&_h2]:mt-2.5',
              '[&_h3]:text-base [&_h3]:font-medium [&_h3]:mb-1 [&_h3]:mt-2',
              '[&_p]:mb-2 [&_p]:leading-relaxed',
              '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2',
              '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2',
              '[&_li]:mb-0.5',
              '[&_blockquote]:border-l-4 [&_blockquote]:border-primary/50 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-2',
              '[&_pre]:bg-muted [&_pre]:p-2.5 [&_pre]:rounded [&_pre]:font-mono [&_pre]:text-xs [&_pre]:my-2 [&_pre]:overflow-x-auto',
              '[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2'
            )}
          />
        )}
      </div>
    </TooltipProvider>
  )
}

interface ToolbarButtonProps {
  title: string
  onClick: () => void
  icon?: React.ReactNode
  text?: string
  active?: boolean
}

function ToolbarButton({ title, onClick, icon, text, active }: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type='button'
          onClick={onClick}
          className={cn(
            'inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors',
            active && 'bg-accent text-accent-foreground font-semibold'
          )}
        >
          {icon || <span className='text-xs font-bold'>{text}</span>}
        </button>
      </TooltipTrigger>
      <TooltipContent side='bottom' className='text-xs py-1 px-2'>
        {title}
      </TooltipContent>
    </Tooltip>
  )
}
