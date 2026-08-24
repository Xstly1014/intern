---
title: Redis 面试高频 100 题
---

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const iframeRef = ref(null)

function adjustHeight() {
  const iframe = iframeRef.value
  if (!iframe) return
  try {
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (doc && doc.body) {
      const h = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight)
      iframe.style.height = h + 'px'
    }
  } catch (e) {
    iframe.style.height = 'calc(100vh - 4rem)'
  }
}

let timer = null

onMounted(() => {
  const iframe = iframeRef.value
  if (iframe) {
    iframe.addEventListener('load', adjustHeight)
    timer = setInterval(adjustHeight, 2000)
  }
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  const iframe = iframeRef.value
  if (iframe) iframe.removeEventListener('load', adjustHeight)
})
</script>

<div style="width: 100%;">
  <iframe
    ref="iframeRef"
    src="/intern/interview/redis.html"
    style="width: 100%; border: none; min-height: calc(100vh - 4rem); display: block;"
    frameborder="0"
    scrolling="no"
  ></iframe>
</div>
