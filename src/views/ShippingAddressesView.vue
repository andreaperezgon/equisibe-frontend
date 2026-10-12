<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import ShippingAddressForm from '../components/account/ShippingAddressForm.vue'
import {
  getShippingAddresses,
  createShippingAddress,
  updateShippingAddress,
} from '../services/shippingAddressService'

const addresses = ref([])
const loading = ref(true)
const saving = ref(false)
const loadError = ref('')
const saveError = ref('')
const success = ref('')
const formVisible = ref(false)
const editingAddress = ref(null)

let active = true

const errorMessage = (error, fallback) => {
  const status = error.response?.status

  if (status === 401 || status === 403) {
    return 'No se pudo autorizar la operación. Inicia sesión de nuevo.'
  }

  if (status === 400) {
    return 'Revisa los datos de la dirección e inténtalo de nuevo.'
  }

  if (status === 404) {
    return 'Esta dirección ya no está disponible. Recarga la página.'
  }

  return fallback
}

const loadAddresses = async () => {
  loading.value = true
  loadError.value = ''

  try {
    const result = await getShippingAddresses()
    if (active) addresses.value = result
  } catch (error) {
    if (active) {
      loadError.value = errorMessage(
        error,
        'No se pudieron cargar tus direcciones.',
      )
    }
  } finally {
    if (active) loading.value = false
  }
}

const openForm = (address = null) => {
  editingAddress.value = address
  saveError.value = ''
  success.value = ''
  formVisible.value = true
}

const closeForm = () => {
  if (saving.value) return
  formVisible.value = false
  editingAddress.value = null
  saveError.value = ''
}

const saveAddress = async (payload) => {
  if (saving.value) return

  saving.value = true
  saveError.value = ''
  success.value = ''
  const id = editingAddress.value?.id

  try {
    const saved = id == null
      ? await createShippingAddress(payload)
      : await updateShippingAddress(id, payload)

    if (!active) return

    addresses.value = id == null
      ? [saved, ...addresses.value]
      : addresses.value.map((address) =>
          address.id === id ? saved : address,
        )

    formVisible.value = false
    editingAddress.value = null
    success.value = id == null
      ? 'Dirección guardada.'
      : 'Dirección actualizada.'
  } catch (error) {
    if (active) {
      saveError.value = errorMessage(
        error,
        'No se pudo guardar la dirección. Inténtalo de nuevo.',
      )
    }
  } finally {
    if (active) saving.value = false
  }
}

onMounted(loadAddresses)
onBeforeUnmount(() => { active = false })
</script>

<template>
  <main class="mx-auto max-w-5xl px-5 py-12 md:px-8">
    <RouterLink to="/account" class="text-sm underline underline-offset-4">
      ← Volver a mi cuenta
    </RouterLink>

    <h1 class="mt-6 text-3xl">Mis direcciones</h1>
    <p class="mt-3 text-black/70">
      Guarda tus direcciones para futuras compras. Solo realizamos envíos a España.
    </p>

    <p v-if="loading" role="status" class="mt-8">
      Cargando direcciones…
    </p>

    <div v-else-if="loadError" class="mt-8">
      <p role="alert" class="text-red-700">{{ loadError }}</p>
      <button
        type="button"
        class="mt-4 border-2 border-black px-5 py-2"
        @click="loadAddresses"
      >
        Reintentar
      </button>
    </div>

    <template v-else>
      <p v-if="success" role="status" class="mt-6 text-green-800">
        {{ success }}
      </p>

      <ShippingAddressForm
        v-if="formVisible"
        class="mt-8"
        :address="editingAddress"
        :saving="saving"
        :error="saveError"
        @save="saveAddress"
        @cancel="closeForm"
      />

      <button
        v-else
        type="button"
        class="mt-8 border-2 border-black bg-black px-6 py-3 font-bold text-white"
        @click="openForm()"
      >
        Añadir dirección
      </button>

      <p
        v-if="!addresses.length && !formVisible"
        role="status"
        class="mt-6 text-black/70"
      >
        Todavía no tienes direcciones guardadas.
      </p>

      <ul
        v-if="addresses.length"
        aria-label="Direcciones guardadas"
        class="mt-8 grid gap-6 md:grid-cols-2"
      >
        <li
          v-for="address in addresses"
          :key="address.id"
          class="break-words border border-black/15 p-6"
        >
          <h2 class="font-bold">{{ address.recipientName }}</h2>
          <address class="mt-3 not-italic leading-relaxed text-black/70">
            <p>{{ address.addressLine1 }}</p>
            <p v-if="address.addressLine2">{{ address.addressLine2 }}</p>
            <p>{{ address.postalCode }} · {{ address.city }}</p>
            <p v-if="address.province">{{ address.province }}</p>
            <p>{{ address.countryCode === 'ES' ? 'España' : address.countryCode }}</p>
            <p class="mt-2">{{ address.phone }}</p>
          </address>
          <button
            v-if="!formVisible"
            type="button"
            :aria-label="`Editar dirección en ${address.addressLine1}`"
            class="mt-4 text-sm underline underline-offset-4"
            @click="openForm(address)"
          >
            Editar
          </button>
        </li>
      </ul>
    </template>
  </main>
</template>