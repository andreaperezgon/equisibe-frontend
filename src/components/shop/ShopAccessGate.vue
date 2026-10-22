<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { getShopStatus } from '../../services/shopSettingsService'

const route = useRoute()
const status = ref(null)
const checking = ref(true)
const error = ref('')
const now = ref(Date.now())
let offset = 0
let sequence = 0
let controller
let alive = true
let fetching = false
let pollTimer
let clockTimer

const countdown = computed(() => {
  const target = Date.parse(status.value?.countdownTarget ?? '')
  if (!Number.isFinite(target)) return null
  const seconds = Math.max(0, Math.ceil((target - now.value) / 1000))
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor(seconds / 3600) % 24,
    minutes: Math.floor(seconds / 60) % 60,
    seconds: seconds % 60,
  }
})

async function refresh(reset = false) {
  if (fetching && !reset) return
  const current = ++sequence
  controller?.abort()
  controller = new AbortController()
  fetching = true
  if (reset) checking.value = true

  try {
    const data = await getShopStatus(controller.signal)
    if (!alive || current !== sequence) return
    if (typeof data.closed !== 'boolean') throw new Error('Estado no válido')
    status.value = data
    error.value = ''
    const serverTime = Date.parse(data.serverNow)
    offset = Number.isFinite(serverTime) ? serverTime - Date.now() : 0
    now.value = Date.now() + offset
  } catch {
    if (!alive || current !== sequence) return
    error.value = 'No podemos comprobar la disponibilidad de Tienda. Inténtalo de nuevo.'
  } finally {
    if (alive && current === sequence) {
      checking.value = false
      fetching = false
    }
  }
}

function onVisibility() {
  if (document.visibilityState === 'visible') refresh()
}

watch(() => route.fullPath, () => refresh(true), { immediate: true })

onMounted(() => {
  pollTimer = setInterval(() => refresh(), 15000)
  clockTimer = setInterval(() => { now.value = Date.now() + offset }, 1000)
  document.addEventListener('visibilitychange', onVisibility)
})

onBeforeUnmount(() => {
  alive = false
  sequence += 1
  controller?.abort()
  clearInterval(pollTimer)
  clearInterval(clockTimer)
  document.removeEventListener('visibilitychange', onVisibility)
})
</script>

<template>
  <main v-if="checking" class="mx-auto max-w-3xl px-6 py-20 text-center">
    <p role="status">Comprobando disponibilidad de Tienda…</p>
  </main>

  <main v-else-if="error" class="mx-auto max-w-3xl px-6 py-20 text-center">
    <p role="alert">{{ error }}</p>
    <button type="button" class="mt-5 border border-black px-5 py-3" @click="refresh(true)">
      Reintentar
    </button>
    <RouterLink to="/" class="mt-5 block underline">Volver a Inicio</RouterLink>
  </main>

  <main v-else-if="status?.closed" class="flex min-h-[65vh] items-center justify-center px-5 py-14">
    <section aria-labelledby="shop-closed-title" class="shop-closed-card w-full max-w-2xl p-7 text-center sm:p-12">
      <p class="text-sm uppercase tracking-widest">Equisibé · Tienda</p>
      <h1 id="shop-closed-title" class="mt-5 text-3xl sm:text-4xl">
        {{ status.title }}
      </h1>
      <p class="mt-6 whitespace-pre-line leading-relaxed">{{ status.text }}</p>

      <div v-if="status.countdownEnabled && countdown" class="mt-8">
        <p class="text-sm">Cuenta atrás</p>
        <div class="mt-4 grid grid-cols-4 gap-2 sm:gap-4" role="timer" aria-label="Cuenta atrás de Tienda">
          <div v-for="unit in [
            { value: countdown.days, label: 'días' },
            { value: countdown.hours, label: 'horas' },
            { value: countdown.minutes, label: 'minutos' },
            { value: countdown.seconds, label: 'segundos' },
          ]" :key="unit.label" class="shop-countdown-unit px-1 py-4">
            <span class="block text-2xl font-bold sm:text-3xl">{{ String(unit.value).padStart(2, '0') }}</span>
            <span class="mt-2 block text-xs sm:text-sm">{{ unit.label }}</span>
          </div>
        </div>
      </div>

      <RouterLink to="/" class="mt-8 inline-block text-sm underline">
        Volver a Inicio
      </RouterLink>
    </section>
  </main>

  <slot v-else-if="status" />
</template>

<style scoped>
/* shop-closed-design */
.shop-closed-card {
  background: #fdfcfb;
  border: 1px solid #dce4e7;
  border-radius: 28px;
  box-shadow: 0 16px 48px rgba(52, 67, 74, 0.10);
  color: #34434a;
}

.shop-closed-card h1 {
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.shop-countdown-unit {
  background: #eaf2f5;
  border: 1px solid #d6e2e7;
  border-radius: 16px;
}

@media (max-width: 480px) {
  .shop-closed-card {
    border-radius: 22px;
  }

  .shop-countdown-unit {
    border-radius: 12px;
  }
}
</style>
