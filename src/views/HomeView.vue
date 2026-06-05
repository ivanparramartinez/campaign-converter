<template>
  <div class="page">
    <header class="home-header">
      <div class="logo">Campaign <span>Converter</span></div>
      <div class="tagline">GM Campaign Asset Toolset</div>
    </header>

    <div class="hero">
      <h1>Build GM email campaigns<br /><strong>faster.</strong></h1>
      <p>A set of tools to verify vehicle images, generate email JSON payloads, and build vehicle data — all in one place.</p>
    </div>

    <div class="flow">
      <div class="flow-label">Suggested flow</div>
      <div class="flow-step setup">0. Campaign Setup</div>
      <div class="flow-arrow">→</div>
      <div class="flow-step">1. Image Checker</div>
      <div class="flow-arrow">→</div>
      <div class="flow-step">2. JSON Generator</div>
      <div class="flow-arrow">+</div>
      <div class="flow-step">3. Trim Collection</div>
      <div class="flow-arrow">+</div>
      <div class="flow-step">4. Interior Builder</div>
    </div>

    <div class="grid">
      <router-link to="/setup" class="card setup-card">
        <div class="card-num">Step 00</div>
        <div class="card-tag tag-setup">Campaign Setup</div>
        <div class="card-title">Campaign Data Setup</div>
        <div class="card-desc">Load trim, exterior, interior and model data once. All values become available across every tool automatically — no re-entry needed.</div>
        <div class="card-arrow">Open tool →</div>
      </router-link>

      <router-link to="/checker" class="card">
        <div class="card-num">Tool 01</div>
        <div class="card-tag tag-checker">Image Checker</div>
        <div class="card-title">Image Checker</div>
        <div class="card-desc">Verify which model/trim/color combinations have real images vs 2×2 tracking pixels. Export valid pairs directly to the JSON Generator.</div>
        <div class="card-arrow">Open tool →</div>
      </router-link>

      <router-link to="/generator" class="card">
        <div class="card-num">Tool 02</div>
        <div class="card-tag tag-gen">JSON Generator</div>
        <div class="card-title">JSON Generator</div>
        <div class="card-desc">Generate email campaign JSON objects for all event codes using validated image combinations, interior colors, and dealer data.</div>
        <div class="card-arrow">Open tool →</div>
      </router-link>

      <router-link to="/trim-matrix" class="card">
        <div class="card-num">Tool 03a</div>
        <div class="card-tag tag-matrix">Trim Matrix</div>
        <div class="card-title">Trim Matrix</div>
        <div class="card-desc">For each MMC code, see all applicable trims with their text. Copy the full matrix to Excel with one click.</div>
        <div class="card-arrow">Open tool →</div>
      </router-link>

      <router-link to="/trim-collection" class="card">
        <div class="card-num">Tool 03</div>
        <div class="card-tag tag-trim">Trim Collection</div>
        <div class="card-title">Trim Collection Creator</div>
        <div class="card-desc">Build trim/MMC combination objects for a brand and model year. Outputs structured JSON ready to paste into campaign configs.</div>
        <div class="card-arrow">Open tool →</div>
      </router-link>

      <router-link to="/interior" class="card">
        <div class="card-num">Tool 04</div>
        <div class="card-tag tag-interior">Interior Builder</div>
        <div class="card-title">Interior Builder</div>
        <div class="card-desc">Create interior code/text pair objects for a vehicle nameplate. Supports bulk paste input and exports clean JSON.</div>
        <div class="card-arrow">Open tool →</div>
      </router-link>

      <router-link to="/models" class="card">
        <div class="card-num">Tool 06</div>
        <div class="card-tag tag-models">Model Collection</div>
        <div class="card-title">Model Collection Creator</div>
        <div class="card-desc">Build model objects (MMC + model name) per brand and model year. Diff checker included to spot duplicates against existing data.</div>
        <div class="card-arrow">Open tool →</div>
      </router-link>

      <router-link to="/exteriors" class="card">
        <div class="card-num">Tool 05</div>
        <div class="card-tag tag-exterior">Exterior Collection</div>
        <div class="card-title">Exterior Collection Creator</div>
        <div class="card-desc">Build exterior color objects (color code + name) per brand, model year, and nameplate. Includes diff checker to spot duplicates.</div>
        <div class="card-arrow">Open tool →</div>
      </router-link>
    </div>

    <footer>Campaign Converter — GM Campaign Asset Toolset</footer>
  </div>
</template>

<script setup></script>

<style scoped>
.page { min-height: 100vh; display: flex; flex-direction: column; }

.home-header {
  border-bottom: 1px solid var(--border); padding: 20px 40px;
  display: flex; align-items: center; gap: 16px;
}
.logo { font-family: var(--mono); font-size: 14px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; }
.logo span { color: var(--accent); }
.tagline { font-size: 12px; color: var(--muted); font-family: var(--mono); }

.hero { padding: 60px 40px 40px; max-width: 860px; }
.hero h1 { font-size: 32px; font-weight: 300; line-height: 1.3; margin-bottom: 12px; }
.hero h1 strong { font-weight: 500; color: var(--accent); }
.hero p { font-size: 14px; color: var(--muted2); line-height: 1.7; max-width: 560px; }

.flow {
  margin: 0 40px 40px;
  border: 1px solid var(--border); border-radius: 8px;
  padding: 16px 20px; background: var(--surface);
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
}
.flow-label { font-family: var(--mono); font-size: 10px; color: var(--muted); letter-spacing: 0.1em; text-transform: uppercase; white-space: nowrap; }
.flow-step {
  font-family: var(--mono); font-size: 11px; color: var(--muted2);
  background: var(--surface2); border: 1px solid var(--border2);
  border-radius: 3px; padding: 4px 10px; white-space: nowrap;
}
.flow-step.setup { border-color: rgba(129,140,248,0.5); color: #818cf8; }
.flow-arrow { color: var(--muted); font-size: 14px; }

.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; padding: 0 40px 60px; }

.card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 8px; padding: 24px;
  display: flex; flex-direction: column; gap: 12px;
  transition: border-color 0.15s, background 0.15s;
}
.card:hover { border-color: var(--accent); background: var(--surface2); }
.setup-card { border-color: rgba(129,140,248,0.25); background: rgba(129,140,248,0.04); }

.card-num { font-family: var(--mono); font-size: 10px; color: var(--muted); letter-spacing: 0.14em; text-transform: uppercase; }
.card-title { font-size: 17px; font-weight: 500; }
.card-desc { font-size: 13px; color: var(--muted2); line-height: 1.6; flex: 1; }
.card-arrow { font-family: var(--mono); font-size: 11px; color: var(--muted); transition: color 0.15s; }
.card:hover .card-arrow { color: var(--accent); }

.card-tag {
  display: inline-block; font-family: var(--mono); font-size: 10px;
  padding: 2px 8px; border-radius: 3px; border: 1px solid; width: fit-content;
}
.tag-setup    { color: #818cf8; border-color: rgba(129,140,248,0.3); background: rgba(129,140,248,0.06); }
.tag-checker  { color: #00c8ff; border-color: rgba(0,200,255,0.3);   background: rgba(0,200,255,0.06); }
.tag-gen      { color: var(--accent); border-color: rgba(200,255,0,0.3); background: rgba(200,255,0,0.06); }
.tag-matrix   { color: #f87171; border-color: rgba(248,113,113,0.3); background: rgba(248,113,113,0.06); }
.tag-trim     { color: #ff9f43; border-color: rgba(255,159,67,0.3);  background: rgba(255,159,67,0.06); }
.tag-interior { color: #a29bfe; border-color: rgba(162,155,254,0.3); background: rgba(162,155,254,0.06); }
.tag-exterior { color: #ff9f43; border-color: rgba(255,159,67,0.3);  background: rgba(255,159,67,0.06); }
.tag-models   { color: #34d399; border-color: rgba(52,211,153,0.3);  background: rgba(52,211,153,0.06); }

footer { margin-top: auto; border-top: 1px solid var(--border); padding: 16px 40px; font-family: var(--mono); font-size: 11px; color: var(--muted); }
</style>
