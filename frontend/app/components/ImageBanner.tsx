import Image from 'next/image'

export default function ImageBanner({src, alt}: {src: string; alt: string}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={1200}
      height={300}
      className="w-full object-cover h-[300px]"
    />
  )
}
