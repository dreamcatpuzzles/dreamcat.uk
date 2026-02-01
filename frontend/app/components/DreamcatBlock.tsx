import {type PortableTextBlock} from 'next-sanity'

import PortableText from '@/app/components/PortableText'
import {DreamcatBlock as TypeDreamcatBlock} from '@/sanity.types'
import {cn} from '../utils/cn'
import Image from './SanityImage'

type BlockProps = {
  block: TypeDreamcatBlock
  index: number
  // Needed if you want to createDataAttributes to do non-text overlays in Presentation (Visual Editing)
  pageId: string
  pageType: string
}

function DivWrapper({
  image,
  mode,
  showImageOnly,
  children,
}: {
  image: TypeDreamcatBlock['image'] | null | undefined
  mode: TypeDreamcatBlock['mode']
  showImageOnly?: boolean
  children: React.ReactNode
}) {
  if (image?.asset?._ref) {
    if (showImageOnly) {
      return (
        <Image
          id={image?.asset?._ref}
          alt="Demo image"
          height={500}
          crop={image.crop}
          mode="cover"
          className="w-full h-full object-cover mb-8"
        />
      )
    }
    return (
      <div className="relative overflow-hidden">
        <Image
          id={image?.asset?._ref}
          alt="Demo image"
          crop={image.crop}
          mode="cover"
          className="absolute rounded-sm inset-0 w-full h-full object-cover mb-8"
        />
        <div className="absolute inset-0 w-full h-full curtain" />
        <div className="container relative text-white my-24">{children}</div>
      </div>
    )
  }
  return (
    <div
      className={cn('container my-24', mode === 'inverted' ? 'bg-primary-900' : 'bg-secondary-200')}
    >
      {children}
    </div>
  )
}

export default function DreamcatBlock({block}: BlockProps) {
  return (
    <DivWrapper
      image={block.image}
      mode={block.mode}
      showImageOnly={!block.heading && !block.pullQuote && !block.content}
    >
      <div className="max-w-3xl">
        {block?.pullQuote && (
          <span className="block mt-4 mb-8 italic text-xl">{block.pullQuote}</span>
        )}
        {block?.heading && <h2 className="text-2xl md:text-3xl lg:text-4xl">{block.heading}</h2>}
        <div className="mt-4">
          {block?.content?.length && (
            <PortableText className="" value={block.content as PortableTextBlock[]} />
          )}
        </div>
      </div>
    </DivWrapper>
  )
}
