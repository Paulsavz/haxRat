import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { productsApi } from '@/lib/api'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProductDetailClient from './ProductDetailClient'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const product = await productsApi.getBySlug(slug)
    return {
      title: product.name,
      description: product.description,
      openGraph: {
        title: product.name,
        description: product.description,
        images: product.images?.[0] ? [product.images[0]] : [],
      },
    }
  } catch {
    return { title: 'Product not found' }
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params

  let product
  try {
    product = await productsApi.getBySlug(slug)
  } catch {
    notFound()
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ProductDetailClient product={product} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
