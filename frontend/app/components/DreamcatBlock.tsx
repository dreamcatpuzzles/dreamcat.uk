import {type PortableTextBlock} from 'next-sanity'

import PortableText from '@/app/components/PortableText'
import {DreamcatBlock as TypeDreamcatBlock} from '@/sanity.types'

type BlockProps = {
  block: TypeDreamcatBlock
  index: number
  // Needed if you want to createDataAttributes to do non-text overlays in Presentation (Visual Editing)
  pageId: string
  pageType: string
}

export default function DreamcatBlock({block}: BlockProps) {
  return (
    <div className="container my-12">
      <div className="max-w-3xl">
        {block?.pullQuote && (
          <span className="block mt-4 mb-8 text-lg uppercase font-light text-gray-900/70">
            {block.pullQuote}
          </span>
        )}
        {block?.heading && <h2 className="text-2xl md:text-3xl lg:text-4xl">{block.heading}</h2>}
        <div className="mt-4">
          {block?.content?.length && (
            <PortableText className="" value={block.content as PortableTextBlock[]} />
          )}
        </div>
      </div>
    </div>
  )
}
