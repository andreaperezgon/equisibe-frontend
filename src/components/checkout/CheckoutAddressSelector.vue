<script setup>
import { RouterLink } from 'vue-router'

defineProps({
  addresses: {
    type: Array,
    default: () => [],
  },
  modelValue: {
    type: Number,
    default: null,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <section aria-labelledby="checkout-address-title">
    <h2 id="checkout-address-title" class="text-xl font-bold">
      Dirección de envío
    </h2>

    <p v-if="addresses.length === 0" class="mt-4 text-black/70">
      Añade una dirección en España para continuar con tu compra.
    </p>

    <fieldset
      v-else
      :disabled="disabled"
      class="mt-5 grid min-w-0 gap-4"
    >
      <legend class="sr-only">
        Selecciona una dirección de envío
      </legend>

      <label
        v-for="address in addresses"
        :key="address.id"
        :class="[
          modelValue === address.id
            ? 'border-black bg-black/5'
            : 'border-black/20',
          disabled || address.countryCode !== 'ES'
            ? 'cursor-not-allowed opacity-60'
            : 'cursor-pointer',
        ]"
        class="flex items-start gap-3 border-2 p-5"
      >
        <input
          type="radio"
          name="shippingAddress"
          :value="address.id"
          :checked="modelValue === address.id"
          :disabled="disabled || address.countryCode !== 'ES'"
          class="mt-1 shrink-0 accent-black"
          @change="emit('update:modelValue', address.id)"
        />

        <span class="min-w-0 break-words">
          <span class="block font-bold">
            {{ address.recipientName }}
          </span>

          <span class="mt-2 block text-sm text-black/70">
            {{ address.addressLine1 }}
          </span>

          <span
            v-if="address.addressLine2"
            class="block text-sm text-black/70"
          >
            {{ address.addressLine2 }}
          </span>

          <span class="block text-sm text-black/70">
            {{ address.postalCode }} · {{ address.city }}
          </span>

          <span
            v-if="address.province"
            class="block text-sm text-black/70"
          >
            {{ address.province }}
          </span>

          <span class="block text-sm text-black/70">
            {{
              address.countryCode === 'ES'
                ? 'España'
                : address.countryCode
            }}
          </span>

          <span class="mt-2 block text-sm text-black/70">
            {{ address.phone }}
          </span>

          <span
            v-if="address.countryCode !== 'ES'"
            class="mt-2 block text-sm text-red-700"
          >
            Solo realizamos envíos a España. Edita esta dirección.
          </span>
        </span>
      </label>
    </fieldset>

    <RouterLink
      to="/account/addresses"
      class="mt-5 inline-block text-sm underline underline-offset-4"
    >
      {{
        addresses.length
          ? 'Añadir o editar direcciones'
          : 'Añadir una dirección'
      }}
    </RouterLink>
  </section>
</template>