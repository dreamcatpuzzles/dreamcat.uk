import {CogIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'
import type {Link, Settings} from '../../../sanity.types'

import * as demo from '../../lib/initialValues'

/**
 * Settings schema Singleton.  Singletons are single documents that are displayed not in a collection, handy for things like site settings and other global configurations.
 * Learn more: https://www.sanity.io/docs/create-a-link-to-a-single-edit-page-in-your-main-document-type-list
 */

export const settings = defineType({
  name: 'settings',
  title: 'Settings',
  type: 'document',
  icon: CogIcon,
  fields: [
    defineField({
      name: 'title',
      description: 'This field is the title of your blog.',
      title: 'Title',
      type: 'string',
      initialValue: demo.title,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      description: 'Used on the Homepage',
      title: 'Description',
      type: 'array',
      initialValue: demo.description,
      of: [
        // Define a minified block content field for the description. https://www.sanity.io/docs/block-content
        defineArrayMember({
          type: 'block',
          options: {},
          styles: [],
          lists: [],
          marks: {
            decorators: [],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  defineField({
                    name: 'linkType',
                    title: 'Link Type',
                    type: 'string',
                    initialValue: 'href',
                    options: {
                      list: [
                        {title: 'URL', value: 'href'},
                        {title: 'Page', value: 'page'},
                        {title: 'Post', value: 'post'},
                      ],
                      layout: 'radio',
                    },
                  }),
                  defineField({
                    name: 'href',
                    title: 'URL',
                    type: 'url',
                    hidden: ({parent}) => parent?.linkType !== 'href' && parent?.linkType != null,
                    validation: (Rule) =>
                      Rule.custom((value, context) => {
                        const parent = context.parent as Link
                        if (parent?.linkType === 'href' && !value) {
                          return 'URL is required when Link Type is URL'
                        }
                        return true
                      }),
                  }),
                  defineField({
                    name: 'page',
                    title: 'Page',
                    type: 'reference',
                    to: [{type: 'page'}],
                    hidden: ({parent}) => parent?.linkType !== 'page',
                    validation: (Rule) =>
                      Rule.custom((value, context) => {
                        const parent = context.parent as Link
                        if (parent?.linkType === 'page' && !value) {
                          return 'Page reference is required when Link Type is Page'
                        }
                        return true
                      }),
                  }),
                  defineField({
                    name: 'post',
                    title: 'Post',
                    type: 'reference',
                    to: [{type: 'post'}],
                    hidden: ({parent}) => parent?.linkType !== 'post',
                    validation: (Rule) =>
                      Rule.custom((value, context) => {
                        const parent = context.parent as Link
                        if (parent?.linkType === 'post' && !value) {
                          return 'Post reference is required when Link Type is Post'
                        }
                        return true
                      }),
                  }),
                  defineField({
                    name: 'openInNewTab',
                    title: 'Open in new tab',
                    type: 'boolean',
                    initialValue: false,
                  }),
                ],
              },
            ],
          },
        }),
      ],
    }),
    defineField({
      name: 'ogImage',
      title: 'Open Graph Image',
      type: 'image',
      description: 'Displayed on social cards and search engine results.',
      options: {
        hotspot: true,
        aiAssist: {
          imageDescriptionField: 'alt',
        },
      },
      fields: [
        defineField({
          name: 'alt',
          description: 'Important for accessibility and SEO.',
          title: 'Alternative text',
          type: 'string',
          validation: (rule) => {
            return rule.custom((alt, context) => {
              const document = context.document as Settings
              if (document?.ogImage?.asset?._ref && !alt) {
                return 'Required'
              }
              return true
            })
          },
        }),
        defineField({
          name: 'metadataBase',
          type: 'url',
          description: (
            <a
              href="https://nextjs.org/docs/app/api-reference/functions/generate-metadata#metadatabase"
              rel="noreferrer noopener"
            >
              More information
            </a>
          ),
        }),
      ],
    }),
    defineField({
      name: 'headerLinks',
      title: 'Header Navigation Links',
      type: 'array',
      description: 'Add links to be displayed in the header navigation',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'title',
              title: 'Link Text',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'link',
              title: 'Link',
              type: 'object',
              fields: [
                {
                  name: 'linkType',
                  title: 'Link Type',
                  type: 'string',
                  initialValue: 'href',
                  options: {
                    list: [
                      {title: 'URL', value: 'href'},
                      {title: 'Page', value: 'page'},
                      {title: 'Post', value: 'post'},
                    ],
                    layout: 'radio',
                  },
                },
                defineField({
                  name: 'href',
                  title: 'URL',
                  type: 'url',
                  hidden: ({parent}) => parent?.linkType !== 'href' && parent?.linkType != null,
                  validation: (Rule) =>
                    Rule.custom((value, context) => {
                      const parent = context.parent as Link
                      if (parent?.linkType === 'href' && !value) {
                        return 'URL is required when Link Type is URL'
                      }
                      return true
                    }),
                }),
                defineField({
                  name: 'page',
                  title: 'Page',
                  type: 'reference',
                  to: [{type: 'page'}],
                  hidden: ({parent}) => parent?.linkType !== 'page',
                  validation: (Rule) =>
                    Rule.custom((value, context) => {
                      const parent = context.parent as Link
                      if (parent?.linkType === 'page' && !value) {
                        return 'Page reference is required when Link Type is Page'
                      }
                      return true
                    }),
                }),
                defineField({
                  name: 'post',
                  title: 'Post',
                  type: 'reference',
                  to: [{type: 'post'}],
                  hidden: ({parent}) => parent?.linkType !== 'post',
                  validation: (Rule) =>
                    Rule.custom((value, context) => {
                      const parent = context.parent as Link
                      if (parent?.linkType === 'post' && !value) {
                        return 'Post reference is required when Link Type is Post'
                      }
                      return true
                    }),
                }),
                {
                  name: 'openInNewTab',
                  title: 'Open in new tab',
                  type: 'boolean',
                  initialValue: false,
                },
              ],
            },
          ],
          preview: {
            select: {
              title: 'title',
              linkType: 'link.linkType',
              href: 'link.href',
              pageTitle: 'link.page.name',
              postTitle: 'link.post.title',
              pageSlug: 'link.page.slug.current',
              postSlug: 'link.post.slug.current'
            },
            prepare({title, linkType, href, pageTitle, postTitle, pageSlug, postSlug}) {
              let subtitle = '';
              if (linkType === 'href') {
                subtitle = `URL: ${href}`;
              } else if (linkType === 'page' && pageTitle) {
                subtitle = `Page: ${pageTitle}${pageSlug ? ` (/${pageSlug})` : ''}`;
              } else if (linkType === 'post' && postTitle) {
                subtitle = `Post: ${postTitle}${postSlug ? ` (${postSlug})` : ''}`;
              }
              return {
                title: title || 'Untitled',
                subtitle: subtitle || 'No link set',
              };
            },
          },
        },
      ],
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Settings',
      }
    },
  },
})
