<script setup>
import { reactive, ref, watch } from 'vue'

const props = defineProps({
  address: {
    type: Object,
    default: null,
  },
  saving: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['save', 'cancel'])

const localError = ref('')
const form = reactive({})

const fields = [
  {
    key: 'recipientName',
    label: 'Nombre y apellidos',
    autocomplete: 'shipping name',
    max: 100,
  },
  {
    key: 'phone',
    label: 'Teléfono',
    autocomplete: 'shipping tel',
    type: 'tel',
    max: 25,
  },
  {
    key: 'addressLine1',
    label: 'Calle y número',
    autocomplete: 'shipping address-line1',
    max: 200,
  },
  {
    key: 'addressLine2',
    label: 'Piso, puerta u otras indicaciones (opcional)',
    autocomplete: 'shipping address-line2',
    optional: true,
    max: 100,
  },
  {
    key: 'city',
    label: 'Localidad',
    autocomplete: 'shipping address-level2',
    max: 100,
  },
  {
    key: 'province',
    label: 'Provincia',
    autocomplete: 'shipping address-level1',
    max: 100,
  },
  {
    key: 'postalCode',
    label: 'Código postal',
    autocomplete: 'shipping postal-code',
    max: 5,
    pattern: '[0-9]{5}',
    inputmode: 'numeric',
  },
]

watch(
  () => props.address,
  (address) => {
    for (const field of fields) {
      form[field.key] = address?.[field.key] ?? ''
    }

    localError.value = ''
  },
  { immediate: true },
)

const submit = () => {
  if (props.saving) return

  localError.value = ''

  const payload = Object.fromEntries(
    fields.map(({ key }) => [key, form[key].trim()]),
  )

  if (fields.some((field) => !field.optional && !payload[field.key])) {
    localError.value = 'Completa todos los campos obligatorios.'
    return
  }

  if (!/^[0-9]{5}$/.test(payload.postalCode)) {
    localError.value = 'El código postal debe tener cinco cifras.'
    return
  }

  const phoneDigits = payload.phone.replace(/\D/g, '').length

  if (
    !/^[+]?[0-9 ()-]{7,25}$/.test(payload.phone) ||
    phoneDigits < 7 ||
    phoneDigits > 15
  ) {
    localError.value = 'Introduce un teléfono válido.'
    return
  }

  emit('save', {
    ...payload,
    addressLine2: payload.addressLine2 || null,
    countryCode: 'ES',
  })
}
</script>

<template>
  <form
    class="border border-black/15 p-6"
    :aria-busy="saving"
    aria-labelledby="address-form-title"
    @submit.prevent="submit"
  >
    <h2 id="address-form-title" class="text-xl font-bold">
      {{ address ? 'Editar dirección' : 'Nueva dirección' }}
    </h2>

    <p class="mt-2 text-sm text-black/60">
      País de envío: España.
    </p>

    <fieldset
      :disabled="saving"
      class="mt-6 grid min-w-0 gap-4 sm:grid-cols-2"
    >
      <legend class="sr-only">Datos de la dirección</legend>

      <div v-for="field in fields" :key="field.key">
        <label :for="`address-${field.key}`" class="block text-sm">
          {{ field.label }}
        </label>

        <input
          :id="`address-${field.key}`"
          v-model="form[field.key]"
          :name="field.key"
          :type="field.type ?? 'text'"
          :autocomplete="field.autocomplete"
          :maxlength="field.max"
          :pattern="field.pattern"
          :inputmode="field.inputmode"
          :required="!field.optional"
          class="mt-2 w-full border border-black/30 bg-white px-3 py-2 text-black focus:outline-2 focus:outline-offset-2 focus:outline-black"
        />
      </div>
    </fieldset>

    <p
      v-if="localError || error"
      role="alert"
      class="mt-4 text-sm text-red-700"
    >
      {{ localError || error }}
    </p>

    <div class="mt-6 flex flex-wrap gap-3">
      <button
        type="submit"
        :disabled="saving"
        class="border-2 border-black bg-black px-5 py-2 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {{ saving ? 'Guardando…' : 'Guardar dirección' }}
      </button>

      <button
        type="button"
        :disabled="saving"
        class="border-2 border-black px-5 py-2 disabled:cursor-not-allowed disabled:opacity-40"
        @click="emit('cancel')"
      >
        Cancelar
      </button>
    </div>
  </form>
</template>