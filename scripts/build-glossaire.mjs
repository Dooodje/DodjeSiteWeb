#!/usr/bin/env node
/**
 * Les pages /glossaire/[slug] ont été regroupées en novembre 2026 dans le glossaire complet
 * (/guides/glossaire-finance-investissement-2026, une ancre #term-[slug] par terme).
 * Elles répétaient trois fois la même définition et Google les laissait « Détectées, non indexées ».
 * Les anciennes adresses redirigent vers l'ancre (public/_redirects).
 *
 * Pour ajouter un terme : ajoute un bloc <div class="glossaire-item" id="term-[slug]"> dans
 * guides/glossaire-finance-investissement-2026.html (et, si tu veux garder la trace, dans data/glossaire-termes.json).
 * Ne recrée pas de page par terme.
 */
console.log('Glossaire : les pages par terme sont regroupées dans /guides/glossaire-finance-investissement-2026. Rien à générer.')
