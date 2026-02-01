import {defineField, defineType} from 'sanity'
import {TextIcon} from '@sanity/icons'

export const dreamcatBlock = defineType({
  name: 'dreamcatBlock',
  title: 'Dreamcat Block',
  type: 'object',
  icon: TextIcon,
  // TODO add image field (as background)
  fields: [
    defineField({
      name: 'mode',
      title: 'Mode',
      type: 'string',
      options: {
        list: [
          {title: 'Normal', value: 'normal'},
          {title: 'Inverted', value: 'inverted'},
        ],
      },
      initialValue: 'normal',
    }),
    defineField({
      name: 'image',
      type: 'image',
    }),
    defineField({
      name: 'pullQuote',
      title: 'Pull Quote',
      type: 'string',
    }),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'blockContent',
    }),
  ],
  preview: {
    select: {
      title: 'heading',
      pullQuote: 'pullQuote',
    },
    prepare({title, pullQuote}) {
      return {
        title: title || pullQuote || 'Untitled Block',
        subtitle: 'Page section',
      }
    },
  },
})
