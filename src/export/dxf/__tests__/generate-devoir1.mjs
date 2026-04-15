#!/usr/bin/env node
/**
 * Génération du schéma unifilaire NF C 15-100 pour le devoir EP1/EP2 n°1 :
 * pavillon "rue des Cigales" (Lyonnaise des Eaux, Morsang-sur-Seine).
 *
 * Source : EP1EP2Devoir1.pdf — dossier technique (DT).
 *
 * Caractéristiques extraites du DT :
 *   - Alimentation : 230 V monophasée, 9 kVA, 45 A
 *   - Disjoncteur de branchement : 45 A, différentiel 500 mA sélectif
 *   - Régime de neutre : TT
 *   - Longueur câble alim. : 18,8 m + 1,5 m (rue) + 2 m (garage) = 22,3 m
 *   - Deux gaines ICTA entre tableau (garage) et 1er étage :
 *       Gaine éclairage :
 *         - 1 circuit lumière ch.1 + escalier/palier + SdB
 *         - 1 circuit lumière ch.2 + ch.3
 *       Gaine prises :
 *         - 1 circuit prise ch.1 + escalier/palier + SdB
 *         - 1 circuit prise ch.2 + ch.3
 *
 * Sortie : /tmp/dhc-devoir1-unifilaire.dxf
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const DXF_DIR = path.resolve(here, "..");

const { renderUnifilaire } = await import(pathToFileURL(path.join(DXF_DIR, "unifilaire.js")).href);

const input = {
  smartHomeId: "FR-91270-CIG01-01",
  generatedAt: new Date().toISOString(),
  delivery: {
    supplyType: "monophase",
    agcp: { rating: 45, label: "AGCP 45 A / 500 mA sél." },
  },
  boards: [
    {
      id: "TGBT",
      label: "Tableau général — rue des Cigales",
      rcds: [
        // DDR type A (obligatoire pour plaque + lave-linge, NF C 15-100 §771)
        {
          id: "ID1",
          label: "ID 40 A / 30 mA type A",
          sensitivity: 30,
          type: "A",
          feeds: ["C5", "C6", "C7"],
        },
        // DDR type AC — éclairage RDC + étage (gaine ICTA éclairage)
        {
          id: "ID2",
          label: "ID 40 A / 30 mA type AC",
          sensitivity: 30,
          type: "AC",
          feeds: ["C1", "C2", "C3", "C4"],
        },
        // DDR type AC — prises RDC + étage (gaine ICTA prises)
        {
          id: "ID3",
          label: "ID 40 A / 30 mA type AC",
          sensitivity: 30,
          type: "AC",
          feeds: ["C8", "C9", "C10", "C11"],
        },
        // DDR type AC — chauffage / chauffe-eau / divers
        {
          id: "ID4",
          label: "ID 40 A / 30 mA type AC",
          sensitivity: 30,
          type: "AC",
          feeds: ["C12", "C13", "C14"],
        },
      ],
      circuits: [
        // === Éclairage (1,5 mm² / 10 A / max 8 points) ===
        {
          id: "C1",
          label: "Éclairage RDC jour (séjour, cuisine, entrée, WC)",
          breaker: { rating: 10, curve: "C" },
          wire: { section: 1.5, conductor: "Cu" },
          maxPoints: 8,
        },
        {
          id: "C2",
          label: "Éclairage RDC service (cellier, garage, terrasse, esc.)",
          breaker: { rating: 10, curve: "C" },
          wire: { section: 1.5, conductor: "Cu" },
          maxPoints: 8,
        },
        {
          id: "C3",
          label: "Éclairage étage — ch.1 + esc./palier + SdB",
          breaker: { rating: 10, curve: "C" },
          wire: { section: 1.5, conductor: "Cu" },
          maxPoints: 8,
        },
        {
          id: "C4",
          label: "Éclairage étage — ch.2 + ch.3",
          breaker: { rating: 10, curve: "C" },
          wire: { section: 1.5, conductor: "Cu" },
          maxPoints: 8,
        },

        // === Cuisine & appareils dédiés (DDR type A) ===
        {
          id: "C5",
          label: "Plaque de cuisson (sortie câble 32 A)",
          breaker: { rating: 32, curve: "C" },
          wire: { section: 6, conductor: "Cu" },
          maxPoints: 1,
        },
        {
          id: "C6",
          label: "Prises cuisine 20 A (6 + 2 spé)",
          breaker: { rating: 20, curve: "C" },
          wire: { section: 2.5, conductor: "Cu" },
          maxPoints: 8,
        },
        {
          id: "C7",
          label: "Lave-linge cellier (sortie 16 A)",
          breaker: { rating: 20, curve: "C" },
          wire: { section: 2.5, conductor: "Cu" },
          maxPoints: 1,
        },

        // === Prises 16 A (DDR prises) ===
        {
          id: "C8",
          label: "Prises séjour (7 × 16 A)",
          breaker: { rating: 16, curve: "C" },
          wire: { section: 2.5, conductor: "Cu" },
          maxPoints: 8,
        },
        {
          id: "C9",
          label: "Prises RDC divers (cellier, entrée, WC, garage, terrasse)",
          breaker: { rating: 16, curve: "C" },
          wire: { section: 2.5, conductor: "Cu" },
          maxPoints: 8,
        },
        {
          id: "C10",
          label: "Prises étage — ch.1 + esc./palier + SdB",
          breaker: { rating: 16, curve: "C" },
          wire: { section: 2.5, conductor: "Cu" },
          maxPoints: 8,
        },
        {
          id: "C11",
          label: "Prises étage — ch.2 + ch.3",
          breaker: { rating: 16, curve: "C" },
          wire: { section: 2.5, conductor: "Cu" },
          maxPoints: 8,
        },

        // === Équipements dédiés ===
        {
          id: "C12",
          label: "Chauffe-eau",
          breaker: { rating: 20, curve: "C" },
          wire: { section: 2.5, conductor: "Cu" },
          maxPoints: 1,
        },
        {
          id: "C13",
          label: "Sortie câble 16 A cellier",
          breaker: { rating: 16, curve: "C" },
          wire: { section: 2.5, conductor: "Cu" },
          maxPoints: 1,
        },
        {
          id: "C14",
          label: "Communication (ETEL / RJ45)",
          breaker: { rating: 2, curve: "C" },
          wire: { section: 1.5, conductor: "Cu" },
          maxPoints: 1,
        },
      ],
    },
  ],
};

const dxf = renderUnifilaire(input);
const out = "/tmp/dhc-devoir1-unifilaire.dxf";
fs.writeFileSync(out, dxf);

const kb = (dxf.length / 1024).toFixed(1);
console.log(`✓ Schéma unifilaire généré : ${out}`);
console.log(`  ${kb} KB · ${dxf.split("\n").length} lignes`);
console.log(`  AGCP : ${input.delivery.agcp.label}`);
console.log(`  DDR  : ${input.boards[0].rcds.length}`);
console.log(`  Circuits : ${input.boards[0].circuits.length}`);

// Sanity checks
if (!dxf.trim().endsWith("EOF")) { console.error("  ✗ Fichier DXF invalide"); process.exit(1); }
if (!dxf.includes("\\U+")) { console.error("  ✗ Escapes Unicode manquants"); process.exit(1); }
for (const kw of ["DLAB5", "Format A", "AGCP", "DDR_30_A", "DDR_30_AC", "MCB"]) {
  if (!dxf.includes(kw)) { console.error(`  ✗ ${kw} manquant`); process.exit(1); }
}
console.log("  ✓ Structure DXF valide (EOF, escapes Unicode, symboles présents)");
console.log("\nOuvrir dans LibreCAD / QCAD pour vérification visuelle.");
