<template>
  <header class="app-header">
    <nav class="topnav">
      <router-link to="/" class="logo-link">
        <span class="logo">Campaign <span class="accent">Converter</span></span>
      </router-link>
      <div class="spacer" />
      <router-link to="/models"          class="nav-link">Models</router-link>
      <router-link to="/trim-matrix"     class="nav-link">Trim Matrix</router-link>
      <router-link to="/trim-collection" class="nav-link">Trim Collection</router-link>
      <router-link to="/exteriors"       class="nav-link">Exteriors</router-link>
      <router-link to="/interior"        class="nav-link">Interior</router-link>
      <router-link to="/checker"         class="nav-link">Checker</router-link>
      <router-link to="/generator"       class="nav-link">Generator</router-link>
      <router-link to="/dealer-replace"  class="nav-link">Dealers</router-link>
      <router-link to="/validator"       class="nav-link">Validator</router-link>
      <router-link to="/setup"           class="nav-link">Setup</router-link>
      <router-link to="/viewer"          class="nav-link">Viewer</router-link>
    </nav>
    <GlobalBar v-if="showGlobalBar" />
  </header>
</template>

<script setup>
import GlobalBar from './GlobalBar.vue'
defineProps({ showGlobalBar: { type: Boolean, default: true } })
</script>

<style scoped>
.app-header { position: sticky; top: 0; z-index: 300; background: var(--bg); }

.topnav {
  border-bottom: 1px solid var(--border);
  padding: 10px 20px;
  display: flex; align-items: center; gap: 4px;
}

.logo-link { text-decoration: none; margin-right: 8px; }
.logo {
  font-family: var(--mono); font-size: 12px; font-weight: 600;
  letter-spacing: 0.14em; text-transform: uppercase; color: var(--text);
}
.logo .accent { color: var(--accent); }

.spacer { flex: 1; }

.nav-link {
  font-family: var(--mono); font-size: 11px; color: var(--muted);
  padding: 4px 10px; border-radius: 3px;
  transition: color 0.1s; text-decoration: none;
}
.nav-link:hover { color: var(--text); }
.nav-link.router-link-active { color: var(--accent); }
</style>
