import { apiFetch } from '../AuthContext'
import { readResponseError } from './imageUpload'

// Current subscription status for the logged-in user (+ the offered plan/price).
export const fetchSubscriptionStatus = async () => {
  const response = await apiFetch('/api/subscription/me')
  if (!response.ok) {
    throw new Error(
      await readResponseError(response, 'Failed to load subscription status.'),
    )
  }
  return response.json()
}

// Simulated checkout: send the (fake) card details, activate premium for one month.
export const purchasePremium = async (payment) => {
  const response = await apiFetch('/api/subscription/purchase', {
    method: 'POST',
    body: JSON.stringify(payment),
  })
  if (!response.ok) {
    throw new Error(
      await readResponseError(response, 'Payment failed. Please try again.'),
    )
  }
  return response.json()
}
