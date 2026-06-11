const CWDCart = (() => {
  const MEDUSA_URL = 'https://customwheeldeal-medusa.medusajs.app';
  const PUB_KEY = 'pk_358a5681030f0eb3b532cb1eec073294c355d371af0f14cb217d700702266842';
  const REGION_ID = 'reg_01KRH3QA6EXHMJ6C05139NH0TK';
  const STRIPE_PK = 'pk_test_51TWI9AAcBHUUqvZkY4efxZ7Psfk88Bch2DaZTZw25eKMSIz8VW69UN47hgLhsgfwW9WdukDwCM4zRFTP0ZCvClsD007utRldVc';
  const VARIANTS = {
    tire: 'variant_01KRH4PFHRG3VFKYP7ME3D7D63',
    wheel: 'variant_01KRH5KD6F35WRB08TNMWHS793'
  };
  const FEE_VARIANT = 'variant_01KRYN1WRCNH424JGSCTE3NKJZ';
  const CART_KEY = 'cwd_cart_id';

  const listeners = [];

  const _headers = () => ({
    'Content-Type': 'application/json',
    'x-publishable-api-key': PUB_KEY
  });

  async function _getOrCreateCart() {
    const cartId = localStorage.getItem(CART_KEY);
    if (cartId) {
      try {
        const res = await fetch(`${MEDUSA_URL}/store/carts/${cartId}`, { headers: _headers() });
        if (res.ok) {
          const { cart } = await res.json();
          return cart;
        }
      } catch (e) {}
      localStorage.removeItem(CART_KEY);
    }
    const res = await fetch(`${MEDUSA_URL}/store/carts`, {
      method: 'POST',
      headers: _headers(),
      body: JSON.stringify({ region_id: REGION_ID })
    });
    const { cart } = await res.json();
    localStorage.setItem(CART_KEY, cart.id);
    return cart;
  }

  async function _fetchCart() {
    const cartId = localStorage.getItem(CART_KEY);
    if (!cartId) return null;
    try {
      const res = await fetch(`${MEDUSA_URL}/store/carts/${cartId}`, { headers: _headers() });
      if (!res.ok) return null;
      const { cart } = await res.json();
      return cart;
    } catch (e) { return null; }
  }

  function _mapItem(lineItem) {
    const meta = lineItem.metadata || {};
    return {
      lineItemId: lineItem.id,
      id: meta.product_id || lineItem.id,
      type: meta.type || 'tire',
      name: meta.name || lineItem.title || '',
      brand: meta.brand || '',
      size: meta.size || '',
      price: parseFloat(meta.actual_price || 0),
      qty: lineItem.quantity,
      image: meta.image || '',
      partNumber: meta.part_number || '',
      vehicle: meta.vehicle || '',
    };
  }

  async function getItems() {
    const cart = await _fetchCart();
    return (cart?.items || []).map(_mapItem);
  }

  async function addItem(product) {
    const cart = await _getOrCreateCart();
    const variantId = VARIANTS[product.type] || VARIANTS.tire;

    const titleOverride = product.title || product.name || undefined;
    // Auto-read selected vehicle from localStorage if caller didn't provide one
    const vehicleDisplay = product.vehicle || (function() {
      try {
        var v = JSON.parse(localStorage.getItem('htm_vehicle') || 'null');
        if (v && v.year) return [v.year, v.make, v.model].filter(Boolean).join(' ');
      } catch(e) {}
      return '';
    })();
    const res = await fetch(`${MEDUSA_URL}/store/custom-line-items`, {
      method: 'POST',
      headers: _headers(),
      body: JSON.stringify({
        cart_id: cart.id,
        variant_id: variantId,
        quantity: product.qty || 4,
        unit_price: Number(product.price || 0),
        title: titleOverride,
        metadata: {
          product_id: String(product.id || ''),
          type: product.type || 'tire',
          name: product.name || '',
          brand: product.brand || product.rawBrand || product.wheelBrand || product.tireBrand || '',
          size: product.size || '',
          actual_price: String(product.price || 0),
          image: product.image || '',
          part_number: product.partNumber || '',
          vehicle: vehicleDisplay,
        }
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to add item to cart');
    }

    _notify();
    await _updateBadge();
  }

  async function addFeeItem({ title, unitPrice, quantity, kind }) {
    const cartId = localStorage.getItem(CART_KEY);
    if (!cartId) throw new Error('No cart');
    const res = await fetch(`${MEDUSA_URL}/store/custom-line-items`, {
      method: 'POST',
      headers: _headers(),
      body: JSON.stringify({
        cart_id: cartId,
        variant_id: FEE_VARIANT,
        quantity: quantity || 1,
        unit_price: Number(unitPrice || 0),
        title,
        metadata: { kind: kind || 'fee', fee_label: title }
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to add fee: ${title}`);
    }
  }

  async function removeItem(lineItemId) {
    const cartId = localStorage.getItem(CART_KEY);
    if (!cartId) return;
    await fetch(`${MEDUSA_URL}/store/carts/${cartId}/line-items/${lineItemId}`, {
      method: 'DELETE',
      headers: _headers()
    });
    _notify();
    await _updateBadge();
  }

  async function updateQty(lineItemId, qty) {
    const cartId = localStorage.getItem(CART_KEY);
    if (!cartId) return;
    if (qty <= 0) return removeItem(lineItemId);
    await fetch(`${MEDUSA_URL}/store/carts/${cartId}/line-items/${lineItemId}`, {
      method: 'POST',
      headers: _headers(),
      body: JSON.stringify({ quantity: qty })
    });
    _notify();
    await _updateBadge();
  }

  async function clear() {
    localStorage.removeItem(CART_KEY);
    _notify();
    await _updateBadge();
  }

  // ─────────────── Checkout helpers (Storefront API)

  async function getCartData() {
    return _fetchCart();
  }

  async function updateCart(updates) {
    const cartId = localStorage.getItem(CART_KEY);
    if (!cartId) throw new Error('No cart');
    const res = await fetch(`${MEDUSA_URL}/store/carts/${cartId}`, {
      method: 'POST',
      headers: _headers(),
      body: JSON.stringify(updates)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update cart');
    }
    const { cart } = await res.json();
    return cart;
  }

  async function getShippingOptions() {
    const cartId = localStorage.getItem(CART_KEY);
    if (!cartId) return [];
    const res = await fetch(`${MEDUSA_URL}/store/shipping-options?cart_id=${cartId}`, { headers: _headers() });
    if (!res.ok) return [];
    const { shipping_options } = await res.json();
    return shipping_options || [];
  }

  async function addShippingMethod(optionId) {
    const cartId = localStorage.getItem(CART_KEY);
    if (!cartId) throw new Error('No cart');
    const res = await fetch(`${MEDUSA_URL}/store/carts/${cartId}/shipping-methods`, {
      method: 'POST',
      headers: _headers(),
      body: JSON.stringify({ option_id: optionId })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to add shipping method');
    }
    const { cart } = await res.json();
    return cart;
  }

  async function createPaymentCollection() {
    const cartId = localStorage.getItem(CART_KEY);
    if (!cartId) throw new Error('No cart');
    const res = await fetch(`${MEDUSA_URL}/store/payment-collections`, {
      method: 'POST',
      headers: _headers(),
      body: JSON.stringify({ cart_id: cartId })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create payment collection');
    }
    const { payment_collection } = await res.json();
    return payment_collection;
  }

  async function initStripeSession(paymentCollectionId) {
    const res = await fetch(`${MEDUSA_URL}/store/payment-collections/${paymentCollectionId}/payment-sessions`, {
      method: 'POST',
      headers: _headers(),
      body: JSON.stringify({ provider_id: 'pp_stripe_stripe' })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to init Stripe session');
    }
    const { payment_collection } = await res.json();
    return payment_collection;
  }

  async function completeCart() {
    const cartId = localStorage.getItem(CART_KEY);
    if (!cartId) throw new Error('No cart');
    const res = await fetch(`${MEDUSA_URL}/store/carts/${cartId}/complete`, {
      method: 'POST',
      headers: _headers()
    });
    const data = await res.json();
    if (!res.ok || data.type !== 'order') {
      throw new Error((data.error && data.error.message) || data.message || 'Failed to complete cart');
    }
    localStorage.removeItem(CART_KEY);
    return data.order;
  }

  async function getCount() {
    const items = await getItems();
    return items.reduce((s, i) => s + i.qty, 0);
  }

  async function getSubtotal() {
    const items = await getItems();
    return items.reduce((s, i) => s + i.price * i.qty, 0);
  }

  function onChange(fn) { listeners.push(fn); }

  function _notify() { listeners.forEach(fn => fn()); }

  async function _updateBadge() {
    const count = await getCount();
    document.querySelectorAll('[data-cart-count]').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
  }

  async function init() {
    await _updateBadge();
  }

  document.addEventListener('DOMContentLoaded', () => init());

  const config = {
    get medusaUrl() { return MEDUSA_URL; },
    get pubKey() { return PUB_KEY; },
    get regionId() { return REGION_ID; },
    get stripePk() { return STRIPE_PK; },
  };

  return {
    getItems, addItem, addFeeItem, removeItem, updateQty, clear, getCount, getSubtotal, onChange, init, config,
    // Checkout-stage helpers
    getCartData, updateCart, getShippingOptions, addShippingMethod,
    createPaymentCollection, initStripeSession, completeCart,
  };
})();

window.CWDCart = CWDCart;
