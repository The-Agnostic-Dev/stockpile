import { useNavigate } from 'react-router'
import { api } from '../api/client'
import type { ProductDetail } from '../api/types'
import { ProductForm } from '../components/ProductForm'
import { useProducts } from '../state/ProductsContext'

export function NewProduct() {
  const navigate = useNavigate()
  const { refresh } = useProducts()
  return (
    <section>
      <h1>Add product</h1>
      <div className="card">
        <ProductForm
          submitLabel="Add product"
          onCancel={() => navigate('/products')}
          onSubmit={async (values) => {
            const product = await api<ProductDetail>('/products', { method: 'POST', json: values })
            await refresh()
            navigate(`/products/${product.id}`)
          }}
        />
      </div>
    </section>
  )
}
