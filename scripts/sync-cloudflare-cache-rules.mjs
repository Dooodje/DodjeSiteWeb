#!/usr/bin/env node
/**
 * Applies Cloudflare Cache Rules for static assets when the site is served
 * via GitHub Pages behind a Cloudflare-proxied zone (GitHub Pages ignores _headers).
 *
 * Requires: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID
 */

const token = process.env.CLOUDFLARE_API_TOKEN
const zoneId = process.env.CLOUDFLARE_ZONE_ID
const ruleDescription = 'dodje-landing-static-assets-cache'

if (!token || !zoneId) {
  console.log('Skipping Cloudflare cache rules: CLOUDFLARE_API_TOKEN or CLOUDFLARE_ZONE_ID not set.')
  process.exit(0)
}

const api = (path, options = {}) =>
  fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  }).then(async (res) => {
    const body = await res.json()
    if (!body.success) {
      throw new Error(JSON.stringify(body.errors ?? body))
    }
    return body.result
  })

const cacheRule = {
  description: ruleDescription,
  expression: '(starts_with(http.request.uri.path, "/assets/") or http.request.uri.path eq "/favicon.ico")',
  action: 'set_cache_settings',
  action_parameters: {
    cache: true,
    edge_ttl: {
      mode: 'override_origin',
      default: 31536000
    },
    browser_ttl: {
      mode: 'override_origin',
      default: 31536000
    }
  }
}

const htmlRule = {
  description: 'dodje-landing-html-cache',
  expression: '(http.request.uri.path eq "/" or ends_with(http.request.uri.path, ".html"))',
  action: 'set_cache_settings',
  action_parameters: {
    cache: true,
    edge_ttl: {
      mode: 'override_origin',
      default: 3600
    },
    browser_ttl: {
      mode: 'override_origin',
      default: 3600
    }
  }
}

const entrypoint = await api(
  `/zones/${zoneId}/rulesets/phases/http_request_cache_settings/entrypoint`
)

const existingRules = entrypoint.rules ?? []
const managedRules = existingRules.filter(
  (rule) =>
    rule.description !== ruleDescription &&
    rule.description !== htmlRule.description
)

await api(`/zones/${zoneId}/rulesets/${entrypoint.id}`, {
  method: 'PUT',
  body: JSON.stringify({
    rules: [cacheRule, htmlRule, ...managedRules]
  })
})

console.log('Cloudflare cache rules updated for static assets (1 year) and HTML (1 hour).')
